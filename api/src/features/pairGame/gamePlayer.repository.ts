import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere } from 'typeorm'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GamePlayerServiceModel } from './models/game.service.model'

@Injectable()
export class GamePlayerRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

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

		if (updatePlayerRes.affected == 1) {
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
		const dd = await this.getPlayerWhere({ userId })
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
