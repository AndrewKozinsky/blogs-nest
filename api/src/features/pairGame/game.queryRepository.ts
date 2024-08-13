import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsOrder, FindOptionsWhere, Not } from 'typeorm'
import { Game, GameStatus } from '../../db/pg/entities/game/game'
import { GameAnswer } from '../../db/pg/entities/game/gameAnswer'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GamePlayerRepository } from './gamePlayer.repository'
import { GetMyGamesQueries } from './models/game.input.model'
import { GameOutModel, GamesOutModel } from './models/game.output.model'

@Injectable()
export class GameQueryRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		private gamePlayerRepository: GamePlayerRepository,
	) {}

	async getUserGames(
		userId: string,
		queries: GetMyGamesQueries,
	): Promise<LayerResult<GamesOutModel>> {
		const sortBy = queries.sortBy ?? 'createdAt'
		const sortDirection = queries.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = queries.pageNumber ? +queries.pageNumber : 1
		const pageSize = queries.pageSize ? +queries.pageSize : 10

		const totalGamesCount = await this.dataSource
			.getRepository(Game)
			.count({ where: this.getWhereConditionWhereGameHasUserWithId(userId) })

		const pagesCount = Math.ceil(totalGamesCount / pageSize)

		const getGamesRes = await this.getGamesByOptions({
			where: this.getWhereConditionWhereGameHasUserWithId(userId),
			order: { [sortBy]: sortDirection, createdAt: 'desc' },
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
		})

		if (getGamesRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerSuccessCode.Success,
				data: {
					pagesCount: 0,
					page: 0,
					pageSize: 0,
					totalCount: 0,
					items: [],
				},
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: {
				pagesCount,
				page: pageNumber,
				pageSize,
				totalCount: +totalGamesCount,
				items: getGamesRes.data,
			},
		}
	}

	async getGameById(gameId: string): Promise<LayerResult<null | GameOutModel.Main>> {
		const getGamesRes = await this.getGamesByOptions({ where: { id: gameId } })

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

		const getGamesRes = await this.getGamesByOptions({
			where: [{ firstPlayerId: player.id }, { secondPlayerId: player.id }],
		})

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

	private getWhereConditionWhereGameHasUserWithId(
		userId: string,
	): FindOptionsWhere<Game> | FindOptionsWhere<Game>[] {
		return [
			{
				firstPlayer: {
					user: {
						id: userId,
					},
				},
			},
			{
				secondPlayer: {
					user: {
						id: userId,
					},
				},
			},
		]
	}

	private getWhereConditionWhereUnfinishedGameHasUserWithId(
		userId: string,
	): FindOptionsWhere<Game> | FindOptionsWhere<Game>[] {
		return [
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
		]
	}

	async getUnfinishedGameByUserId(
		userId: string,
	): Promise<LayerResult<null | GameOutModel.Main>> {
		const getGamesRes = await this.getGamesByOptions({
			where: this.getWhereConditionWhereUnfinishedGameHasUserWithId(userId),
		})

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

	private async getGamesByOptions(options: {
		where: FindOptionsWhere<Game> | FindOptionsWhere<Game>[] | undefined
		order?: FindOptionsOrder<Game>
		skip?: number
		take?: number
	}): Promise<LayerResult<GameOutModel.Main[]>> {
		const getGameRes = await this.dataSource.getRepository(Game).find({
			where: options.where,
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
			order: options.order,
			skip: options.skip,
			take: options.take,
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
