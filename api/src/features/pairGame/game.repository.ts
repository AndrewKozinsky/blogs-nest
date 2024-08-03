import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere } from 'typeorm'
import { GameStatus, Game } from '../../db/pg/entities/game/game'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
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
			questions: prepareQuestions(dbGame.gameQuestions),
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
						questionId: answer.gameQuestionId,
						addedAt: answer.createdAt.toISOString(),
					}
				}),
				user: dbPlayer.user,
				score: dbPlayer.score,
			} as any
		}

		function prepareQuestions(gameQuestions: GameQuestion[]): GameServiceModel.Question[] {
			return gameQuestions.map((question) => {
				return {
					id: question.questionId.toString(),
					body: question.question.body,
					correctAnswers: question.question.correctAnswers,
				}
			})
		}

		function convertDate(date: null | string | Date): null | string {
			if (!date) {
				return null
			}

			if (typeof date === 'string') {
				return date
			}

			return date.toISOString()
		}
	}
}
