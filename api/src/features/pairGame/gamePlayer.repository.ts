import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GameAnswerStatus } from '../../db/pg/entities/game/gameAnswer'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { Question } from '../../db/pg/entities/game/question'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GamePlayerServiceModel } from './models/gameServiceModel'

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

	async getPlayerById(playerId: string): Promise<LayerResult<GamePlayerServiceModel>> {
		const getPlayerRes = await this.dataSource
			.getRepository(GamePlayer)
			.findOne({ where: { id: playerId }, relations: ['user', 'answers'] })

		if (!getPlayerRes) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGamePlayerToOutGamePlayer(getPlayerRes),
		}
	}

	async getPlayerByUserId(userId: string): Promise<LayerResult<GamePlayerServiceModel>> {
		const getPlayerRes = await this.dataSource.getRepository(GamePlayer).findOne({
			where: { userId },
			relations: {
				user: true,
				answers: {
					gameQuestion: true,
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
			data: this.mapDbGamePlayerToOutGamePlayer(getPlayerRes),
		}
	}

	mapDbGamePlayerToOutGamePlayer(dbGamePlayer: GamePlayer): GamePlayerServiceModel {
		return {
			id: dbGamePlayer.id.toString(),
			user: {
				login: dbGamePlayer.user.login,
			},
			answers: dbGamePlayer.answers.map((answer) => {
				return {
					id: answer.id,
					status: answer.status,
					player: answer.player,
					question: answer.gameQuestion,
					createdAt: answer.createdAt,
				}
			}),
		}
	}
}
