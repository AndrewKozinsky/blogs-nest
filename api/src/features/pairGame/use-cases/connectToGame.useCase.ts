import { Injectable } from '@nestjs/common'
import { GameStatus } from '../../../db/pg/entities/game/game'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { gameConfig } from '../config'
import { GamePlayerServiceModel } from '../models/gameServiceModel'
import { SaQuestionsRepository } from '../../saQuestions/saQuestionsRepository'
import { ConnectionResult } from '../models/game.output.model'
import { GameServiceModel } from '../models/gameServiceModel'
import { GameQuestionRepository } from '../gameQuestion.repository'
import { GameRepository } from '../game.repository'
import { GamePlayerRepository } from '../gamePlayer.repository'

@Injectable()
export class ConnectToGameUseCase {
	constructor(
		private gamePlayerRepository: GamePlayerRepository,
		private gameRepository: GameRepository,
		private gameQuestionRepository: GameQuestionRepository,
		private saQuestionsRepository: SaQuestionsRepository,
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

		// Есть ли игра с ожидающим игроком?
		const getPendingGameRes = await this.gameRepository.getPendingGame()

		// Если свободной игры нет
		if (getPendingGameRes.code !== LayerSuccessCode.Success) {
			return this.createGameWithSinglePlayer(newPlayer)
		}
		// Если есть игра с ожидающим игроком
		else {
			const game = getPendingGameRes.data
			return this.setSecondPlayerToGame(game.id, newPlayer)
		}
	}

	async createGameWithSinglePlayer(
		player: GamePlayerServiceModel,
	): Promise<LayerResult<ConnectionResult.Main>> {
		// Создать игру с одним игроком
		const newGameRes = await this.createGameAndReturn(player.id)
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
						id: player.id,
						login: player.user.login,
					},
					score: 0,
				},
				secondPlayerProgress: null,
				// Questions for both players (can be null if second player haven't connected yet)
				questions: game.gameQuestions,
				status: GameStatus.Pending,
				pairCreatedDate: game.pairCreatedDate, // '2024-07-28T07:45:51.040Z'
				startGameDate: null,
				finishGameDate: null,
			},
		}
	}

	async setSecondPlayerToGame(
		gameId: string,
		player: GamePlayerServiceModel,
	): Promise<LayerResult<ConnectionResult.Main>> {
		// Добавить игрока в существующую игру и поменять статус игры на active
		const addSecondPlayerRes = await this.gameRepository.updateGame(gameId, {
			secondPlayerId: player.id,
			status: GameStatus.Active,
		})
		if (addSecondPlayerRes.code !== LayerSuccessCode.Success) {
			return addSecondPlayerRes
		}

		// Создать 5 вопросов к игре
		await this.createGameRandomQuestions(gameId)

		// Запросить обновлённую игру
		const getUpdatedGameRes = await this.gameRepository.getGameById(gameId)
		if (getUpdatedGameRes.code !== LayerSuccessCode.Success) {
			return getUpdatedGameRes
		}
		const game = getUpdatedGameRes.data
		// console.log(game.questions)

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
						id: player.id,
						login: player.user.login,
					},
					score: 0,
				},
				// Questions for both players (can be null if second player haven't connected yet)
				questions: game.gameQuestions,
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

	async isUserIsPlayerAlready(userId: string): Promise<boolean> {
		const getPlayerByUserIdRes = await this.gamePlayerRepository.getPlayerByUserId(userId)

		if (getPlayerByUserIdRes.code !== LayerSuccessCode.Success) {
			return false
		}

		return !!getPlayerByUserIdRes.data
	}

	async createPlayerAndReturn(userId: string): Promise<LayerResult<GamePlayerServiceModel>> {
		// Создать нового игрока
		const createPlayerRes = await this.gamePlayerRepository.createPlayer(userId)
		if (createPlayerRes.code !== LayerSuccessCode.Success) {
			return createPlayerRes
		}

		const newPlayerId = createPlayerRes.data

		// Вернуть созданного игрока
		return await this.gamePlayerRepository.getPlayerById(newPlayerId)
	}

	/**
	 * Создаёт новую игру
	 * @param firstPlayerId
	 */
	async createGameAndReturn(firstPlayerId: string): Promise<LayerResult<GameServiceModel>> {
		const createNewGameRes = await this.gameRepository.createGame(firstPlayerId)
		if (createNewGameRes.code !== LayerSuccessCode.Success) {
			return createNewGameRes
		}

		const newGameId = createNewGameRes.data

		// Вернуть созданную игру
		return await this.gameRepository.getGameById(newGameId)
	}

	/**
	 * Создаёт 5 случайных вопросов игры.
	 * @param gameId
	 */
	async createGameRandomQuestions(gameId: string) {
		// Получить 5 случайных вопросов
		const getRandomQuestionsRes = await this.saQuestionsRepository.getRandomQuestions(
			gameConfig.questionsNumber,
		)
		if (getRandomQuestionsRes.code !== LayerSuccessCode.Success) {
			return getRandomQuestionsRes
		}

		const gameQuestionQueries = []
		for (let i = 0; i < getRandomQuestionsRes.data.length; i++) {
			const question = getRandomQuestionsRes.data[i]
			const questionId = question.id

			gameQuestionQueries.push(
				this.gameQuestionRepository.createGameQuestion(gameId, questionId, i),
			)
		}

		await Promise.all(gameQuestionQueries)
	}
}
