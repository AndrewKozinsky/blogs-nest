import { Injectable } from '@nestjs/common'
import { add } from 'date-fns'
import { GameStatus } from '../../../db/pg/entities/game/game'
import { GameAnswerStatus } from '../../../db/pg/entities/game/gameAnswer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { gameConfig } from '../config'
import { GameRepository } from '../../../repositories/game/game.repository'
import { GameAnswerQueryRepository } from '../../../repositories/game/gameAnswer.queryRepository'
import { GameAnswerRepository } from '../../../repositories/game/gameAnswer.repository'
import { GamePlayerRepository } from '../../../repositories/game/gamePlayer.repository'
import { GameQuestionRepository } from '../../../repositories/game/gameQuestion.repository'
import { AnswerGameQuestionDtoModel } from '../../../models/pairGame/game.input.model'
import { GameAnswerOutModel } from '../../../models/pairGame/game.output.model'
import {
	GamePlayerServiceModel,
	GameQuestionServiceModel,
	GameServiceModel,
} from '../../../models/pairGame/game.service.model'

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
	): Promise<LayerResult<null | GameAnswerOutModel>> {
		const getGameAndPlayerAndQuestionRes = await this.getGameAndPlayerAndQuestion(userId)
		if (getGameAndPlayerAndQuestionRes.code !== LayerSuccessCode.Success) {
			return getGameAndPlayerAndQuestionRes
		}
		const { game, player, gameQuestion } = getGameAndPlayerAndQuestionRes.data

		const userAnswerStatus = gameQuestion.question.correctAnswers.includes(reqBodyDto.answer)
			? GameAnswerStatus.Correct
			: GameAnswerStatus.Incorrect

		// Создать ответ
		const createAnswerRes = await this.gameAnswerRepository.createGameAnswer(
			player.id,
			gameQuestion.question.questionId,
			userAnswerStatus,
		)
		if (createAnswerRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		// Если игрок ответил правильно...
		if (userAnswerStatus === GameAnswerStatus.Correct) {
			// То увеличить поле score у игрока
			await this.gamePlayerRepository.increaseScore(player.id)
		}

		// Check if all players gave all answers
		const getGameAnswersStatusRes = await this.gameRepository.getGameAnswersStatus(
			gameQuestion.gameId,
		)
		if (getGameAnswersStatusRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		// If one player answered all the questions, then set gameMustBeCompletedNoLaterThan property in Game table
		// to prevent receiving answers from the opponent after the specified time
		if (getGameAnswersStatusRes.data === 'oneAnsweredAllQuestions') {
			const allowedTime = add(new Date(), {
				seconds: 10,
			})

			await this.gameRepository.updateGame(game.id, {
				gameMustBeCompletedNoLaterThan: allowedTime,
			})

			setTimeout(() => {
				this.gameRepository.forceFinishGame(game.id)
			}, 1000 * gameConfig.maxSecondsWhenGameActiveAfterOneUserAnsweredAllQuestions)
		}

		// If all players answered all questions
		if (getGameAnswersStatusRes.data === 'bothAnsweredAllQuestions') {
			// Set finished status to game
			await this.gameRepository.finishGame(gameQuestion.gameId)

			const getFastestPlayerIdRes = await this.gameRepository.getPlayerIdWhichFinishedFirst(
				gameQuestion.gameId,
			)
			if (getFastestPlayerIdRes.code !== LayerSuccessCode.Success) {
				return {
					code: LayerErrorCode.BadRequest_400,
				}
			}
			const fastestPlayerId = getFastestPlayerIdRes.data

			if (fastestPlayerId) {
				await this.gamePlayerRepository.increaseScore(fastestPlayerId)
			}
		}

		const getUpdatedGameRes = await this.gameRepository.getGameById(game.id)
		if (getUpdatedGameRes.code !== LayerSuccessCode.Success || !getUpdatedGameRes.data) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}
		await this.updatePlayerStatistics(getUpdatedGameRes.data, player)

		// Get last answer
		const answerId = createAnswerRes.data
		const newAnswer = await this.gameAnswerQueryRepository.getAnswer(answerId)
		if (newAnswer.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: newAnswer.data,
		}
	}

	async getGameAndPlayerAndQuestion(userId: string): Promise<
		LayerResult<{
			game: GameServiceModel.Main
			player: GamePlayerServiceModel
			gameQuestion: GameQuestionServiceModel
		}>
	> {
		// Найти незавершённую игру, где пользователь является игроком.
		// И если находится, то отдавать 403
		const getGameRes = await this.gameRepository.getUnfinishedGameByUserId(userId)
		if (
			getGameRes.code !== LayerSuccessCode.Success ||
			!getGameRes.data ||
			getGameRes.data.status === GameStatus.Finished
		) {
			return {
				code: LayerErrorCode.Forbidden_403,
			}
		}
		const game = getGameRes.data

		const getPlayerRes = await this.gamePlayerRepository.getUnfinishedGamePlayerByUserId(userId)
		if (getPlayerRes.code !== LayerSuccessCode.Success || !getPlayerRes.data) {
			return {
				code: LayerErrorCode.Forbidden_403,
			}
		}
		const player = getPlayerRes.data

		// Завернуть если пользователь ответил на все вопросы
		if (player.answers.length >= gameConfig.questionsNumber) {
			return {
				code: LayerErrorCode.Forbidden_403,
			}
		}

		// Получить текущий неотвеченный вопрос
		const resCurrentGameQuestionRes =
			await this.gameQuestionRepository.getPlayerCurrentGameQuestion(player.id)
		if (
			resCurrentGameQuestionRes.code !== LayerSuccessCode.Success ||
			!resCurrentGameQuestionRes.data
		) {
			return {
				code: LayerErrorCode.Forbidden_403,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: { game, player, gameQuestion: resCurrentGameQuestionRes.data },
		}
	}

	async updatePlayerStatistics(game: GameServiceModel.Main, playerObj: GamePlayerServiceModel) {
		const { player, rival } = this.getPlayerAndRival(game, playerObj.id)

		const requests: Promise<LayerResult<true>>[] = []

		if (player.score > rival.score) {
			requests.push(
				this.gamePlayerRepository.updateColumn(player.id, 'isPlayerWinning', true),
			)
			requests.push(
				this.gamePlayerRepository.updateColumn(player.id, 'isPlayerLossing', false),
			)
			requests.push(
				this.gamePlayerRepository.updateColumn(player.id, 'isPlayerDrawing', false),
			)

			requests.push(
				this.gamePlayerRepository.updateColumn(rival.id, 'isPlayerWinning', false),
			)
			requests.push(this.gamePlayerRepository.updateColumn(rival.id, 'isPlayerLossing', true))
			requests.push(
				this.gamePlayerRepository.updateColumn(rival.id, 'isPlayerDrawing', false),
			)
		} else if (player.score < rival.score) {
			requests.push(
				this.gamePlayerRepository.updateColumn(player.id, 'isPlayerWinning', false),
			)
			requests.push(
				this.gamePlayerRepository.updateColumn(player.id, 'isPlayerLossing', true),
			)
			requests.push(
				this.gamePlayerRepository.updateColumn(player.id, 'isPlayerDrawing', false),
			)

			requests.push(this.gamePlayerRepository.updateColumn(rival.id, 'isPlayerWinning', true))
			requests.push(
				this.gamePlayerRepository.updateColumn(rival.id, 'isPlayerLossing', false),
			)
			requests.push(
				this.gamePlayerRepository.updateColumn(rival.id, 'isPlayerDrawing', false),
			)
		} else {
			requests.push(
				this.gamePlayerRepository.updateColumn(player.id, 'isPlayerWinning', false),
			)
			requests.push(
				this.gamePlayerRepository.updateColumn(player.id, 'isPlayerLossing', false),
			)
			requests.push(
				this.gamePlayerRepository.updateColumn(player.id, 'isPlayerDrawing', true),
			)

			requests.push(
				this.gamePlayerRepository.updateColumn(rival.id, 'isPlayerWinning', false),
			)
			requests.push(
				this.gamePlayerRepository.updateColumn(rival.id, 'isPlayerLossing', false),
			)
			requests.push(this.gamePlayerRepository.updateColumn(rival.id, 'isPlayerDrawing', true))
		}

		await Promise.all(requests)
	}

	getPlayerAndRival(game: GameServiceModel.Main, playerId: string) {
		return game.firstPlayer.id === playerId
			? { player: game.firstPlayer, rival: game.secondPlayer! }
			: { player: game.secondPlayer!, rival: game.firstPlayer }
	}
}
