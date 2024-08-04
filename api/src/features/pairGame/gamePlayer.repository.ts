import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere } from 'typeorm'
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
				code: LayerErrorCode.NotFound,
			}
		}

		const player = getPlayerRes.data

		const updatePlayerRes = await this.dataSource
			.getRepository(GamePlayer)
			.update(player.id, { score: player.score + 1 })

		if (updatePlayerRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	async getPlayerById(playerId: string): Promise<LayerResult<GamePlayerServiceModel>> {
		return this.getPlayerWhere({ id: playerId })
	}

	async getPlayerByUserId(userId: string): Promise<LayerResult<GamePlayerServiceModel>> {
		return this.getPlayerWhere({ userId })
	}

	private async getPlayerWhere(
		whereCondition: FindOptionsWhere<GamePlayer> | FindOptionsWhere<GamePlayer>[] | undefined,
	): Promise<LayerResult<GamePlayerServiceModel>> {
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
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGamePlayerToServiceGamePlayer(getPlayerRes),
		}
	}

	async addExtraPointForPlayerWhichFinishedFirst(gameId: string): Promise<LayerResult<null>> {
		const getGameRes = await this.gameRepository.getGameById(gameId)
		if (getGameRes.code !== LayerSuccessCode.Success) {
			return getGameRes
		}

		const { firstPlayer, secondPlayer } = getGameRes.data

		const firstPlayerFinished = firstPlayer.answers.length === gameConfig.questionsNumber
		const secondPlayerFinished =
			secondPlayer && secondPlayer.answers.length === gameConfig.questionsNumber

		if (
			firstPlayerFinished &&
			!secondPlayerFinished &&
			getPlayerAnsweredQuestionsLength(firstPlayer) > 0
		) {
			const { firstPlayer } = getGameRes.data

			await this.addExtraPointForPlayer(firstPlayer.id)
		} else if (
			!secondPlayerFinished &&
			secondPlayerFinished &&
			getPlayerAnsweredQuestionsLength(secondPlayer) > 0
		) {
			const { secondPlayer } = getGameRes.data
			await this.addExtraPointForPlayer(secondPlayer!.id)
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}

		function getPlayerAnsweredQuestionsLength(player: null | GameServiceModel.Player): number {
			if (!player) return 0

			return player.answers.filter((answer) => {
				return answer.answerStatus === GameAnswerStatus.Correct
			}).length
		}
	}

	async addExtraPointForPlayer(playerId: string): Promise<LayerResult<null>> {
		const getPlayerRes = await this.getPlayerWhere({ id: playerId })
		if (getPlayerRes.code !== LayerSuccessCode.Success) {
			return getPlayerRes
		}
		const player = getPlayerRes.data

		const updatePlayerRes = await this.dataSource.getRepository(GamePlayer).update(playerId, {
			score: player.score + 1,
		})
		if (updatePlayerRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest,
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
