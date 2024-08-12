import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere, Not } from 'typeorm'
import { Game, GameStatus } from '../../db/pg/entities/game/game'
import { GameAnswer } from '../../db/pg/entities/game/gameAnswer'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GamePlayerRepository } from './gamePlayer.repository'
import { GetMyGamesDtoModel } from './models/game.input.model'
import { GameOutModel } from './models/game.output.model'

@Injectable()
export class GameQueryRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		private gamePlayerRepository: GamePlayerRepository,
	) {}

	async getUserGames(
		gameId: string,
		queryOptions: GetMyGamesDtoModel,
	): Promise<LayerResult<GameOutModel.Main[]>> {
		return this.getGamesWhere({ id: gameId })
	}

	async getGameById(gameId: string): Promise<LayerResult<null | GameOutModel.Main>> {
		const getGamesRes = await this.getGamesWhere({ id: gameId })

		if (getGamesRes.code !== LayerSuccessCode.Success || !getGamesRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGamesRes.data[0],
		}
	}

	async getGameByUserId(userId: string): Promise<LayerResult<null | GameOutModel.Main>> {
		const getPlayerRes = await this.gamePlayerRepository.getPlayerByUserId(userId)
		if (getPlayerRes.code !== LayerSuccessCode.Success || !getPlayerRes.data) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const player = getPlayerRes.data

		const getGamesRes = await this.getGamesWhere([
			{ firstPlayerId: player.id },
			{ secondPlayerId: player.id },
		])

		if (getGamesRes.code !== LayerSuccessCode.Success || !getGamesRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGamesRes.data[0],
		}
	}

	async getUnfinishedGameByUserId(
		userId: string,
	): Promise<LayerResult<null | GameOutModel.Main>> {
		const getGamesRes = await this.getGamesWhere([
			{
				firstPlayer: {
					user: {
						id: userId,
					},
				},
				status: Not(GameStatus.Finished),
			},
			{
				secondPlayer: {
					user: {
						id: userId,
					},
				},
				status: Not(GameStatus.Finished),
			},
		])

		if (getGamesRes.code !== LayerSuccessCode.Success || !getGamesRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGamesRes.data[0],
		}
	}

	private async getGamesWhere(
		whereCondition: FindOptionsWhere<Game> | FindOptionsWhere<Game>[] | undefined,
	): Promise<LayerResult<GameOutModel.Main[]>> {
		const getGameRes = await this.dataSource.getRepository(Game).find({
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

		for (const game of getGameRes) {
			game.gameQuestions = game.gameQuestions.sort((a, b) => {
				return a.index > b.index ? 1 : -1
			})

			game.firstPlayer.answers = sortAnswers(game.firstPlayer.answers)
			if (game.secondPlayer) {
				game.secondPlayer.answers = sortAnswers(game.secondPlayer.answers)
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGameRes.map(this.mapDbGameToOutGame),
		}

		function sortAnswers(answers: GameAnswer[]) {
			return answers.sort((a, b) => {
				return a.createdAt < b.createdAt ? -1 : 1
			})
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
