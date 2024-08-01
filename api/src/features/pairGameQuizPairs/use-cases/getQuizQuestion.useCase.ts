import { Injectable } from '@nestjs/common'
import { GameStatus } from '../../../db/pg/entities/quizGame'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { QuizPlayerServiceModel } from '../models/quizGame.service.model'
import { SaQuizQuestionsRepository } from '../../saQuizQuestions/saQuizQuestionsRepository'
import { ConnectionResult } from '../models/quizGame.output.model'
import { QuizGameServiceModel } from '../models/quizGame.service.model'
import { QuizGameQuestionRepository } from '../quizGameQuestionRepository'
import { QuizGameRepository } from '../quizGameRepository'
import { QuizPlayerRepository } from '../quizPlayerRepository'

@Injectable()
export class ConnectToGameUseCase {
	constructor(
		private quizPlayerRepository: QuizPlayerRepository,
		private quizGameRepository: QuizGameRepository,
		private quizGameQuestionRepository: QuizGameQuestionRepository,
		private saQuizQuestionsRepository: SaQuizQuestionsRepository,
	) {}

	async execute(userId: string): Promise<LayerResult<ConnectionResult.Main>> {
		// Вернуть 403 если пользователь уже является игроком (зашёл повторно)
		if (await this.isUserIsPlayerAlready(userId)) {
			return {
				code: LayerErrorCode.Forbidden,
			}
		}

		// Создать нового игрока
		const newPlayerRes = await this.createPlayerAndReturn(userId)
		if (newPlayerRes.code !== LayerSuccessCode.Success) {
			return newPlayerRes
		}
		const newPlayer = newPlayerRes.data

		// Получить игру с одним игроком
		const getPendingGameRes = await this.quizGameRepository.getPendingGame()

		// Если есть игра с одним игроком
		if (getPendingGameRes.code === LayerSuccessCode.Success) {
			const game = getPendingGameRes.data

			// Добавить игрока в существующую игру и поменять статус игры на active
			const addSecondPlayerRes = await this.quizGameRepository.updateGame(game.id, {
				secondPlayerId: newPlayer.id,
				status: GameStatus.Active,
			})
			if (addSecondPlayerRes.code !== LayerSuccessCode.Success) {
				return addSecondPlayerRes
			}

			return {
				code: LayerSuccessCode.Success,
				data: {
					// Id of pair
					id: game.id,
					firstPlayerProgress: {
						answers: [],
						player: {
							id: game.firstPlayer.id,
							login: game.firstPlayer.login,
						},
						score: 0,
					},
					secondPlayerProgress: {
						answers: [],
						player: {
							id: newPlayer.id,
							login: newPlayer.login,
						},
						score: 0,
					},
					// Questions for both players (can be null if second player haven't connected yet)
					questions: game.questions,
					status: GameStatus.Active,
					// Date when first player initialized the pair
					pairCreatedDate: game.pairCreatedDate, // '2024-07-28T07:45:51.040Z'
					// Game starts immediately after second player connection to this pair
					startGameDate: game.pairCreatedDate, // '2024-07-28T07:45:51.040Z'
					// Game finishes immediately after both players have answered all the questions
					finishGameDate: null,
				},
			}
		}
		// Если ожидающей игры нет
		else {
			// Создать игру с одним игроком
			const newGameRes = await this.createGameAndReturn(newPlayer.id)
			if (newGameRes.code !== LayerSuccessCode.Success) {
				return newGameRes
			}

			const game = newGameRes.data

			return {
				code: LayerSuccessCode.Success,
				data: {
					// Id of pair
					id: game.id,
					firstPlayerProgress: {
						answers: [],
						player: {
							id: newPlayer.id,
							login: newPlayer.login,
						},
						score: 0,
					},
					secondPlayerProgress: null,
					// Questions for both players (can be null if second player haven't connected yet)
					questions: game.questions,
					status: GameStatus.Pending,
					pairCreatedDate: game.pairCreatedDate, // '2024-07-28T07:45:51.040Z'
					startGameDate: null,
					finishGameDate: null,
				},
			}
		}
	}

	async isUserIsPlayerAlready(userId: string): Promise<boolean> {
		const getPlayerByUserIdRes = await this.quizPlayerRepository.getPlayerByUserId(userId)

		if (getPlayerByUserIdRes.code !== LayerSuccessCode.Success) {
			return false
		}

		return !!getPlayerByUserIdRes.data
	}

	async createPlayerAndReturn(userId: string): Promise<LayerResult<QuizPlayerServiceModel>> {
		// Создать нового игрока
		const createPlayerRes = await this.quizPlayerRepository.createPlayer(userId)
		if (createPlayerRes.code !== LayerSuccessCode.Success) {
			return createPlayerRes
		}

		const newPlayerId = createPlayerRes.data

		// Вернуть созданного игрока
		return await this.quizPlayerRepository.getPlayerById(newPlayerId)
	}

	/**
	 * Создаёт новую игру
	 * @param firstPlayerId
	 */
	async createGameAndReturn(firstPlayerId: string): Promise<LayerResult<QuizGameServiceModel>> {
		const createNewGameRes = await this.quizGameRepository.createGame(firstPlayerId)
		if (createNewGameRes.code !== LayerSuccessCode.Success) {
			return createNewGameRes
		}

		// Создать 5 вопросов к игре
		const gameId = createNewGameRes.data
		await this.createGameRandomQuestions(gameId)

		const newGameId = createNewGameRes.data

		// Вернуть созданную игру
		return await this.quizGameRepository.getGame(newGameId)
	}

	/**
	 * Создаёт 5 случайных вопросов игры.
	 * @param gameId
	 */
	async createGameRandomQuestions(gameId: string) {
		// Получить 5 случайных вопросов
		const getRandomQuestionsRes = await this.saQuizQuestionsRepository.getRandomQuestions(5)
		if (getRandomQuestionsRes.code !== LayerSuccessCode.Success) {
			return getRandomQuestionsRes
		}

		const gameQuestionQueries = []
		for (let i = 0; i < getRandomQuestionsRes.data.length; i++) {
			const question = getRandomQuestionsRes.data[i]
			const questionId = question.id

			gameQuestionQueries.push(
				this.quizGameQuestionRepository.createGameQuestion(gameId, questionId, i),
			)
		}

		await Promise.all(gameQuestionQueries)
	}
}
