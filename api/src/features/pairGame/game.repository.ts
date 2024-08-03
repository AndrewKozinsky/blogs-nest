import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere } from 'typeorm'
import { GameStatus, Game } from '../../db/pg/entities/game/game'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GameServiceModel } from './models/gameServiceModel'

@Injectable()
export class GameRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPendingGame(): Promise<LayerResult<GameServiceModel>> {
		const getPendingGame = await this.dataSource.getRepository(Game).findOne({
			where: { status: GameStatus.Pending },
			relations: {
				firstPlayer: {
					user: true,
				},
				secondPlayer: {
					user: true,
				},
				gameQuestions: {
					question: true,
				},
			},
		})

		if (!getPendingGame) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGameToServiceGame(getPendingGame),
		}
	}

	async getGameById(gameId: string): Promise<LayerResult<GameServiceModel>> {
		return this.getGameWhere({ id: gameId })
	}

	async getGameByPlayerId(playerId: string): Promise<LayerResult<GameServiceModel>> {
		return this.getGameWhere([{ firstPlayerId: playerId }, { secondPlayerId: playerId }])
	}

	private async getGameWhere(
		whereCondition: FindOptionsWhere<Game> | FindOptionsWhere<Game>[] | undefined,
	): Promise<LayerResult<GameServiceModel>> {
		const getGameRes = await this.dataSource.getRepository(Game).findOne({
			where: whereCondition,
			relations: {
				firstPlayer: {
					user: true,
				},
				secondPlayer: {
					user: true,
				},
				gameQuestions: {
					question: true,
				},
			},
			order: { gameQuestions: { index: 'ASC' } },
		})

		if (!getGameRes) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGameToServiceGame(getGameRes),
		}
	}

	async createGame(firstPlayerId: string): Promise<LayerResult<string>> {
		const createdGameRes = await this.dataSource.getRepository(Game).insert({
			status: GameStatus.Pending,
			firstPlayerId,
		})

		return {
			code: LayerSuccessCode.Success,
			data: createdGameRes.identifiers[0].id.toString(),
		}
	}

	async updateGame(gameId: string, dto: Partial<Game>): Promise<LayerResult<null>> {
		const updateGameRes = await this.dataSource.getRepository(Game).update(gameId, dto)

		if (updateGameRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	mapDbGameToServiceGame(dbGame: Game): GameServiceModel {
		let secondPlayer = null
		if (dbGame.secondPlayer) {
			secondPlayer = {
				id: dbGame.secondPlayerId,
				login: dbGame.secondPlayer.user.login,
			}
		}

		return {
			id: dbGame.id.toString(),
			status: dbGame.status,
			firstPlayer: {
				id: dbGame.firstPlayerId.toString(),
				login: dbGame.firstPlayer.user.login,
			},
			secondPlayer,
			gameQuestions: dbGame.gameQuestions.map((question) => {
				return {
					id: question.questionId.toString(),
					body: question.question.body,
					correctAnswers: question.question.correctAnswers,
				}
			}),
			pairCreatedDate: dbGame.createdAt.toISOString(),
		}
	}
}
