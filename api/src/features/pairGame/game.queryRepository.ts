import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere, Not } from 'typeorm'
import { Game, GameStatus } from '../../db/pg/entities/game/game'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GamePlayerRepository } from './gamePlayer.repository'
import { GameOutModel } from './models/game.output.model'

@Injectable()
export class GameQueryRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		private gamePlayerRepository: GamePlayerRepository,
	) {}

	async getPendingGame(): Promise<LayerResult<GameOutModel.Main>> {
		return this.getGameWhere({ status: GameStatus.Pending })
	}

	async getGameById(gameId: string): Promise<LayerResult<GameOutModel.Main>> {
		return this.getGameWhere({ id: gameId })
	}

	async getUnfinishedGameByUserId(userId: string): Promise<LayerResult<GameOutModel.Main>> {
		const getPlayerRes = await this.gamePlayerRepository.getPlayerByUserId(userId)
		if (!getPlayerRes || getPlayerRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const player = getPlayerRes.data

		return this.getGameWhere([
			{ firstPlayerId: player.id, status: Not(GameStatus.Finished) },
			{ secondPlayerId: player.id, status: Not(GameStatus.Finished) },
		])
	}

	private async getGameWhere(
		whereCondition: FindOptionsWhere<Game> | FindOptionsWhere<Game>[] | undefined,
	): Promise<LayerResult<GameOutModel.Main>> {
		const pendingGame = await this.dataSource.getRepository(Game).findOne({
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
			order: {
				firstPlayer: {
					answers: 'DESC',
				},
				secondPlayer: {
					answers: 'DESC',
				},
			},
		})

		if (!pendingGame) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGameToOutGame(pendingGame),
		}
	}

	mapDbGameToOutGame(dbGame: Game): GameOutModel.Main {
		let secondPlayerProgress = null
		if (dbGame.secondPlayer) {
			secondPlayerProgress = preparePlayerData(dbGame.secondPlayer)
		}

		return {
			id: dbGame.id.toString(),
			status: dbGame.status,
			firstPlayerProgress: preparePlayerData(dbGame.firstPlayer),
			secondPlayerProgress,
			questions: prepareQuestions(dbGame),
			pairCreatedDate: dbGame.createdAt.toISOString(),
			startGameDate: convertDate(dbGame.startGameDate),
			finishGameDate: convertDate(dbGame.finishGameDate),
		}

		function preparePlayerData(dbPlayer: GamePlayer): GameOutModel.Player {
			return {
				answers: dbPlayer.answers.map((answer) => {
					return {
						answerStatus: answer.status,
						questionId: answer.questionId.toString(),
						addedAt: answer.createdAt.toISOString(),
					}
				}),
				player: {
					id: dbPlayer.user.id.toString(),
					login: dbPlayer.user.login,
				},
				score: dbPlayer.score,
			}
		}

		function prepareQuestions(dbGame: Game): null | GameOutModel.Question[] {
			if (dbGame.status === GameStatus.Pending) {
				return null
			}

			return dbGame.gameQuestions.map((gameQuestion) => {
				return {
					id: gameQuestion.questionId.toString(),
					body: gameQuestion.question.body,
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
