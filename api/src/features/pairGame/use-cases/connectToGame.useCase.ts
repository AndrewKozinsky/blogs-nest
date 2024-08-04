import { Injectable } from '@nestjs/common'
import { GameStatus } from '../../../db/pg/entities/game/game'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { gameConfig } from '../config'
import { GameQueryRepository } from '../game.queryRepository'
import { SaQuestionsRepository } from '../../saQuestions/saQuestionsRepository'
import { GameOutModel } from '../models/game.output.model'
import { GameQuestionRepository } from '../gameQuestion.repository'
import { GameRepository } from '../game.repository'
import { GamePlayerRepository } from '../gamePlayer.repository'
import { GamePlayerServiceModel } from '../models/game.service.model'

@Injectable()
export class ConnectToGameUseCase {
	constructor(
		private gamePlayerRepository: GamePlayerRepository,
		private gameRepository: GameRepository,
		private gameQueryRepository: GameQueryRepository,
		private gameQuestionRepository: GameQuestionRepository,
		private saQuestionsRepository: SaQuestionsRepository,
	) {}

	async execute(userId: string): Promise<LayerResult<GameOutModel.Main>> {
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

		let gameId = ''

		// Если свободной игры нет
		if (getPendingGameRes.code !== LayerSuccessCode.Success) {
			const createGameRes = await this.createGameWithSinglePlayer(newPlayer)
			if (createGameRes.code !== LayerSuccessCode.Success) {
				return createGameRes
			}

			gameId = createGameRes.data
		}
		// Если есть игра с ожидающим игроком
		else {
			gameId = getPendingGameRes.data.id
			await this.setSecondPlayerToGame(gameId, newPlayer)
		}

		return this.gameQueryRepository.getGameById(gameId)
	}

	async createGameWithSinglePlayer(player: GamePlayerServiceModel): Promise<LayerResult<string>> {
		// Создать игру с одним игроком
		const createNewGameRes = await this.gameRepository.createGame(player.id)
		if (createNewGameRes.code !== LayerSuccessCode.Success) {
			return createNewGameRes
		}

		const newGameId = createNewGameRes.data

		return {
			code: LayerSuccessCode.Success,
			data: newGameId,
		}
	}

	async setSecondPlayerToGame(
		gameId: string,
		player: GamePlayerServiceModel,
	): Promise<LayerResult<null>> {
		// Добавить игрока в существующую игру и поменять статус игры на active
		const addSecondPlayerRes = await this.gameRepository.updateGame(gameId, {
			secondPlayerId: player.id,
			status: GameStatus.Active,
			startGameDate: new Date(),
		})
		if (addSecondPlayerRes.code !== LayerSuccessCode.Success) {
			return addSecondPlayerRes
		}

		// Создать 5 вопросов к игре
		await this.createGameRandomQuestions(gameId)

		return {
			code: LayerSuccessCode.Success,
			data: null,
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

			gameQuestionQueries.push(
				this.gameQuestionRepository.createGameQuestion(gameId, question.id, i),
			)
		}

		await Promise.all(gameQuestionQueries)
	}
}
