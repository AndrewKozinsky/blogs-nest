import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere } from 'typeorm'
import { GameStatus } from '../../db/pg/entities/game/game'
import { GameAnswerStatus } from '../../db/pg/entities/game/gameAnswer'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { gameConfig } from './config'
import { GameRepository } from './game.repository'
import { GamePlayerServiceModel, GameServiceModel } from './models/game.service.model'

@Injectable()
export class GamePlayerRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		private gameRepository: GameRepository,
	) {}

	async createPlayer(userId: string): Promise<LayerResult<string>> {
		const queryRes = await this.dataSource.getRepository(GamePlayer).insert({
			userId,
			score: 0,
			answers: [],
		})

		return {
			code: LayerSuccessCode.Success,
			data: queryRes.identifiers[0].id.toString(),
		}
	}

	async increaseScore(playerId: string): Promise<LayerResult<true>> {
		const getPlayerRes = await this.getPlayerById(playerId)
		if (getPlayerRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const player = getPlayerRes.data

		if (!player) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		const updatePlayerRes = await this.dataSource
			.getRepository(GamePlayer)
			.update(player.id, { score: player.score + 1 })

		if (updatePlayerRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	async getPlayerById(playerId: string): Promise<LayerResult<null | GamePlayerServiceModel>> {
		return this.getPlayerWhere({ id: playerId })
	}

	async getUnfinishedGamePlayerByUserId(
		userId: string,
	): Promise<LayerResult<null | GamePlayerServiceModel>> {
		const getUnfinishedGamesRes = await this.gameRepository.getUnfinishedGames()
		if (
			getUnfinishedGamesRes.code !== LayerSuccessCode.Success ||
			!getUnfinishedGamesRes.data
		) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		let playerId: null | string = null

		for (const game of getUnfinishedGamesRes.data) {
			if (game.firstPlayer.user.id.toString() === userId) {
				playerId = game.firstPlayer.id
			} else if (game.secondPlayer?.user.id.toString() === userId) {
				playerId = game.secondPlayer.id
			}
		}

		if (!playerId) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return this.getPlayerWhere({ id: playerId })

		// Получить всех игроков у которых стоит переданный идентификатор пользователя
		/*const getUserPlayers = await this.getPlayersByUserId(userId)
		if (getUserPlayers.code !== LayerSuccessCode.Success || !getUserPlayers.data) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		const getGame = await this.gameRepository.getGameByPlayerId(getUserPlayers.data.id)
		if (
			getGame.code !== LayerSuccessCode.Success ||
			(getGame.data && getGame.data.status === GameStatus.Finished)
		) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return this.getPlayerWhere({ id: getUserPlayers.data.id })*/
	}

	async getPlayersByUserId(
		userId: string,
	): Promise<LayerResult<null | GamePlayerServiceModel[]>> {
		return this.getPlayersWhere({ userId })
	}

	async getPlayerByUserId(userId: string): Promise<LayerResult<null | GamePlayerServiceModel>> {
		return this.getPlayerWhere({ userId })
	}

	private async getPlayersWhere(
		whereCondition: FindOptionsWhere<GamePlayer> | FindOptionsWhere<GamePlayer>[] | undefined,
	): Promise<LayerResult<null | GamePlayerServiceModel[]>> {
		const getPlayerRes = await this.dataSource.getRepository(GamePlayer).find({
			where: whereCondition,
			relations: {
				user: true,
				answers: {
					question: true,
					player: true,
				},
			},
		})

		if (!getPlayerRes) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getPlayerRes.map(this.mapDbGamePlayerToServiceGamePlayer),
		}
	}

	private async getPlayerWhere(
		whereCondition: FindOptionsWhere<GamePlayer> | FindOptionsWhere<GamePlayer>[] | undefined,
	): Promise<LayerResult<null | GamePlayerServiceModel>> {
		const getPlayerRes = await this.dataSource.getRepository(GamePlayer).findOne({
			where: whereCondition,
			relations: {
				user: true,
				answers: {
					question: true,
					player: true,
				},
			},
		})

		if (!getPlayerRes) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGamePlayerToServiceGamePlayer(getPlayerRes),
		}
	}

	async addExtraPointForPlayerWhichFinishedFirst(gameId: string): Promise<LayerResult<null>> {
		const getGameRes = await this.gameRepository.getGameById(gameId)
		if (getGameRes.code !== LayerSuccessCode.Success || !getGameRes.data) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		const { firstPlayer, secondPlayer } = getGameRes.data

		const firstPlayerFinished = firstPlayer.answers.length === gameConfig.questionsNumber
		const secondPlayerFinished =
			secondPlayer && secondPlayer.answers.length === gameConfig.questionsNumber

		if (!firstPlayerFinished || !secondPlayerFinished) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		const firstPlayerLastAnswerDate =
			firstPlayer.answers[gameConfig.questionsNumber - 1].addedAt
		const secondPlayerLastAnswerDate =
			secondPlayer.answers[gameConfig.questionsNumber - 1].addedAt

		// If first player gave at least 1 right answer and finished first
		if (
			getPlayerRightAnswersLength(firstPlayer) > 0 &&
			firstPlayerLastAnswerDate < secondPlayerLastAnswerDate
		) {
			await this.addExtraPointToPlayer(firstPlayer.id)
		}

		// If second player gave at least 1 right answer and finished first
		if (
			getPlayerRightAnswersLength(secondPlayer) > 0 &&
			secondPlayerLastAnswerDate < firstPlayerLastAnswerDate
		) {
			await this.addExtraPointToPlayer(secondPlayer.id)
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}

		function getPlayerRightAnswersLength(player: null | GameServiceModel.Player): number {
			if (!player) return 0

			return player.answers.filter((answer) => {
				return answer.answerStatus === GameAnswerStatus.Correct
			}).length
		}
	}

	async addExtraPointToPlayer(playerId: string): Promise<LayerResult<null>> {
		const getPlayerRes = await this.getPlayerWhere({ id: playerId })
		if (getPlayerRes.code !== LayerSuccessCode.Success || !getPlayerRes.data) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const player = getPlayerRes.data

		const updatePlayerRes = await this.dataSource.getRepository(GamePlayer).update(playerId, {
			score: player.score + 1,
		})

		if (updatePlayerRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	mapDbGamePlayerToServiceGamePlayer(dbGamePlayer: GamePlayer): GamePlayerServiceModel {
		return {
			id: dbGamePlayer.id.toString(),
			user: {
				login: dbGamePlayer.user.login,
			},
			score: dbGamePlayer.score,
			answers: dbGamePlayer.answers.map((answer) => {
				return {
					id: answer.id,
					status: answer.status,
					player: {
						id: answer.playerId,
					},
					question: {
						id: answer.question.id,
						body: answer.question.body,
					},
					createdAt: answer.createdAt.toISOString(),
				}
			}),
		}
	}
}
