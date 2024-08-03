import { Injectable } from '@nestjs/common'
import { GameAnswerStatus } from '../../../db/pg/entities/game/gameAnswer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { gameConfig } from '../config'
import { AnswerGameQuestionDtoModel } from '../models/game.input.model'
import { GameAnswerOutModel } from '../models/game.output.model'
import { GameAnswerQueryRepository } from '../gameAnswer.queryRepository'
import { GameAnswerRepository } from '../gameAnswer.repository'
import { GameQuestionRepository } from '../gameQuestion.repository'
import { GamePlayerRepository } from '../gamePlayer.repository'

@Injectable()
export class AnswerGameQuestionUseCase {
	constructor(
		private gamePlayerRepository: GamePlayerRepository,
		private gameQuestionRepository: GameQuestionRepository,
		private gameAnswerRepository: GameAnswerRepository,
		private gameAnswerQueryRepository: GameAnswerQueryRepository,
	) {}

	async execute(
		userId: string,
		reqBodyDto: AnswerGameQuestionDtoModel,
	): Promise<LayerResult<GameAnswerOutModel>> {
		// Завернуть если пользователь не является игроком
		const getPlayerRes = await this.gamePlayerRepository.getPlayerByUserId(userId)
		if (getPlayerRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.Unauthorized,
			}
		}

		const player = getPlayerRes.data

		// Завернуть если пользователь ответил на все вопросы
		if (player.answers.length >= gameConfig.questionsNumber) {
			return {
				code: LayerErrorCode.Forbidden,
			}
		}

		// Получить текущий неотвеченный вопрос
		const resCurrentGameQuestionRes =
			await this.gameQuestionRepository.getPlayerCurrentQuestion(player.id)
		if (resCurrentGameQuestionRes.code !== LayerSuccessCode.Success) {
			return resCurrentGameQuestionRes
		}
		const gameQuestion = resCurrentGameQuestionRes.data

		const isUserAnswerCorrect = gameQuestion.correctAnswers.includes(reqBodyDto.answer)
			? GameAnswerStatus.Correct
			: GameAnswerStatus.Incorrect

		// Если игрок ответил правильно, то увеличить поле score у игрока
		await this.gamePlayerRepository.increaseScore(player.id)

		return this.createAnswerAndReturn(player.id, gameQuestion.id, isUserAnswerCorrect)
	}

	async createAnswerAndReturn(
		playerId: string,
		gameQuestionId: string,
		isUserAnswerCorrect: GameAnswerStatus,
	): Promise<LayerResult<GameAnswerOutModel>> {
		const createGameAnswerRes = await this.gameAnswerRepository.createGameAnswer(
			playerId,
			gameQuestionId,
			isUserAnswerCorrect,
		)
		if (createGameAnswerRes.code !== LayerSuccessCode.Success) {
			return createGameAnswerRes
		}
		const answerId = createGameAnswerRes.data

		const newAnswer = await this.gameAnswerQueryRepository.getAnswer(answerId)
		if (newAnswer.code !== LayerSuccessCode.Success) {
			return newAnswer
		}

		return {
			code: LayerSuccessCode.Success,
			data: newAnswer.data,
		}
	}
}
