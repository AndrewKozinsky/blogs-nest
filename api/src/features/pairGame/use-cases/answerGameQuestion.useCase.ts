import { Injectable } from '@nestjs/common'
import { GameAnswerStatus } from '../../../db/pg/entities/game/gameAnswer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { gameConfig } from '../config'
import { GameRepository } from '../game.repository'
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
		private gameRepository: GameRepository,
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
			await this.gameQuestionRepository.getPlayerCurrentGameQuestion(player.id)
		if (resCurrentGameQuestionRes.code !== LayerSuccessCode.Success) {
			return resCurrentGameQuestionRes
		}
		const gameQuestion = resCurrentGameQuestionRes.data

		const isUserAnswerCorrect = gameQuestion.question.correctAnswers.includes(reqBodyDto.answer)
			? GameAnswerStatus.Correct
			: GameAnswerStatus.Incorrect

		// Создать ответ
		const createAnswerRes = await this.gameAnswerRepository.createGameAnswer(
			player.id,
			gameQuestion.question.questionId,
			isUserAnswerCorrect,
		)

		if (createAnswerRes.code !== LayerSuccessCode.Success) {
			return createAnswerRes
		}

		// Если игрок ответил правильно, то увеличить поле score у игрока
		if (isUserAnswerCorrect) {
			await this.gamePlayerRepository.increaseScore(player.id)
		}

		// Если игрок ответил на все вопросы, то узнать ответил ли на все вопросы другой игрок и завершить игру
		if (getPlayerRes.data.answers.length + 1 === gameConfig.questionsNumber) {
			await this.gameRepository.finishGameIfNeed(gameQuestion.gameId)
		}

		const answerId = createAnswerRes.data

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
