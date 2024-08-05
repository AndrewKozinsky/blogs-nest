import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere } from 'typeorm'
import { Game, GameStatus } from '../../db/pg/entities/game/game'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { gameConfig } from './config'
import { GameServiceModel } from './models/game.service.model'

@Injectable()
export class GameRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPendingGame(): Promise<LayerResult<GameServiceModel.Main>> {
		return this.getGameWhere({ status: GameStatus.Pending })
	}

	async getGameById(gameId: string): Promise<LayerResult<GameServiceModel.Main>> {
		return this.getGameWhere({ id: gameId })
	}

	async getGameByPlayerId(playerId: string): Promise<LayerResult<GameServiceModel.Main>> {
		return this.getGameWhere([{ firstPlayerId: playerId }, { secondPlayerId: playerId }])
	}

	private async getGameWhere(
		whereCondition: FindOptionsWhere<Game> | FindOptionsWhere<Game>[] | undefined,
	): Promise<LayerResult<GameServiceModel.Main>> {
		const getGameRes = await this.dataSource.getRepository(Game).findOne({
			where: whereCondition,
			relations: {
				firstPlayer: {
					user: true,
					answers: true,
				},
				secondPlayer: {
					user: true,
					answers: true,
				},
				gameQuestions: {
					question: true,
				},
			},
			order: { gameQuestions: { index: 'ASC' } },
		})

		if (!getGameRes) {
			return {
				code: LayerErrorCode.NotFound_404,
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
				code: LayerErrorCode.BadRequest_400,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	async finishGameIfNeed(gameId: string): Promise<LayerResult<null>> {
		const getGameRes = await this.getGameById(gameId)
		if (getGameRes.code !== LayerSuccessCode.Success) {
			return getGameRes
		}

		const firstPlayerFinished =
			getGameRes.data.firstPlayer.answers.length === gameConfig.questionsNumber
		const secondPlayerFinished =
			getGameRes.data.secondPlayer &&
			getGameRes.data.secondPlayer.answers.length === gameConfig.questionsNumber

		if (firstPlayerFinished && secondPlayerFinished) {
			await this.dataSource
				.getRepository(Game)
				.update(gameId, { finishGameDate: new Date(), status: GameStatus.Finished })
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	mapDbGameToServiceGame(dbGame: Game): GameServiceModel.Main {
		let secondPlayer = null
		if (dbGame.secondPlayer) {
			secondPlayer = preparePlayerData(dbGame.secondPlayer)
		}

		return {
			id: dbGame.id.toString(),
			status: dbGame.status,
			firstPlayer: preparePlayerData(dbGame.firstPlayer),
			secondPlayer,
			gameQuestions: prepareQuestions(dbGame.gameQuestions),
			pairCreatedDate: dbGame.createdAt.toISOString(),
			startGameDate: convertDate(dbGame.startGameDate),
			finishGameDate: convertDate(dbGame.finishGameDate),
		}

		function preparePlayerData(dbPlayer: GamePlayer): GameServiceModel.Player {
			return {
				id: dbPlayer.id.toString(),
				login: dbPlayer.user.login,
				answers: dbPlayer.answers.map((answer) => {
					return {
						id: answer.id.toString(),
						answerStatus: answer.status,
						questionId: answer.questionId,
						addedAt: answer.createdAt.toISOString(),
					}
				}),
				user: dbPlayer.user,
				score: dbPlayer.score,
			}
		}

		function prepareQuestions(gameQuestions: GameQuestion[]): GameServiceModel.GameQuestion[] {
			return gameQuestions.map((gameQuestion) => {
				return {
					id: gameQuestion.id.toString(),
					question: {
						questionId: gameQuestion.questionId,
						body: gameQuestion.question.body,
						correctAnswers: gameQuestion.question.correctAnswers,
					},
				}
			})
		}

		function convertDate(date: null | string | Date): null | string {
			if (!date) {
				return null
			}

			if (typeof date === 'string') {
				const isoDate = new Date(date).toISOString()
				return isoDate ?? date
			}

			return date.toISOString()
		}
	}
}
