import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere } from 'typeorm'
import { GameStatus, Game } from '../../db/pg/entities/game/game'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GamePlayerRepository } from './gamePlayer.repository'
import { GameOutModel } from './models/game.output.model'
import { GameServiceModel } from './models/game.service.model'

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

	async getGameByUserId(userId: string): Promise<LayerResult<GameOutModel.Main>> {
		const getPlayerRes = await this.gamePlayerRepository.getPlayerByUserId(userId)
		if (!getPlayerRes || getPlayerRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		const player = getPlayerRes.data

		return this.getGameWhere([{ firstPlayerId: player.id }, { secondPlayerId: player.id }])
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
		})

		if (!pendingGame) {
			return {
				code: LayerErrorCode.NotFound,
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
			questions: prepareQuestions(dbGame.gameQuestions),
			pairCreatedDate: dbGame.createdAt.toISOString(),
			startGameDate: convertDate(dbGame.startGameDate),
			finishGameDate: convertDate(dbGame.finishGameDate),
		}

		function preparePlayerData(dbPlayer: GamePlayer): GameOutModel.Player {
			return {
				answers: dbPlayer.answers.map((answer) => {
					return {
						id: answer.id.toString(),
						answerStatus: answer.status,
						questionId: answer.questionId,
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

		function prepareQuestions(gameQuestions: GameQuestion[]): GameOutModel.Question[] {
			return gameQuestions.map((gameQuestion) => {
				return {
					id: gameQuestion.questionId.toString(),
					body: gameQuestion.question.body,
					index: gameQuestion.index,
					correctAnswers: gameQuestion.question.correctAnswers,
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
