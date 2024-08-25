import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere } from 'typeorm'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { truncateFloatNumber } from '../../utils/numbers'
import { GameRepository } from './game.repository'
import { GetTopStatisticQueries } from '../../models/pairGame/game.input.model'
import { TopStatisticsOutModel } from '../../models/pairGame/game.output.model'
import { GamePlayerServiceModel } from '../../models/pairGame/game.service.model'

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
		if (getPlayerRes.code !== LayerSuccessCode.Success || !getPlayerRes.data) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const player = getPlayerRes.data

		const updatePlayerRes = await this.dataSource
			.getRepository(GamePlayer)
			.update(player.id, { score: player.score + 1 })

		if (updatePlayerRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	async updateColumn(
		playerId: string,
		column: 'isPlayerWinning' | 'isPlayerLossing' | 'isPlayerDrawing',
		columnValue: boolean,
	): Promise<LayerResult<true>> {
		const getPlayerRes = await this.getPlayerById(playerId)
		if (getPlayerRes.code !== LayerSuccessCode.Success || !getPlayerRes.data) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const player = getPlayerRes.data

		const updatePlayerRes = await this.dataSource
			.getRepository(GamePlayer)
			.update(player.id, { [column]: columnValue })

		if (updatePlayerRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	async getPlayerById(playerId: string): Promise<LayerResult<null | GamePlayerServiceModel>> {
		const getPlayersRes = await this.getPlayersWhere({ id: playerId })

		if (getPlayersRes.code !== LayerSuccessCode.Success || !getPlayersRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getPlayersRes.data[0],
		}
	}

	async getUnfinishedGamePlayerByUserId(
		userId: string,
	): Promise<LayerResult<null | GamePlayerServiceModel>> {
		const getUnfinishedGamesRes = await this.gameRepository.getUnfinishedGames()
		if (
			getUnfinishedGamesRes.code !== LayerSuccessCode.Success ||
			!getUnfinishedGamesRes.data
		) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		let playerId: null | string = null

		for (const game of getUnfinishedGamesRes.data) {
			if (game.firstPlayer.user.id.toString() === userId) {
				playerId = game.firstPlayer.id
			} else if (game.secondPlayer?.user.id.toString() === userId) {
				playerId = game.secondPlayer.id
			}
		}

		if (!playerId) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		const getPlayersRes = await this.getPlayersWhere({ id: playerId })

		if (getPlayersRes.code !== LayerSuccessCode.Success || !getPlayersRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getPlayersRes.data[0],
		}
	}

	async getPlayersByUserId(
		userId: string,
	): Promise<LayerResult<null | GamePlayerServiceModel[]>> {
		return this.getPlayersWhere({ userId })
	}

	async getPlayerByUserId(userId: string): Promise<LayerResult<null | GamePlayerServiceModel>> {
		const getPlayersRes = await this.getPlayersWhere({ userId })

		if (getPlayersRes.code !== LayerSuccessCode.Success || !getPlayersRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getPlayersRes.data[0],
		}
	}

	private async getPlayersWhere(
		whereCondition: FindOptionsWhere<GamePlayer> | FindOptionsWhere<GamePlayer>[] | undefined,
	): Promise<LayerResult<GamePlayerServiceModel[]>> {
		const getPlayerRes = await this.dataSource.getRepository(GamePlayer).find({
			where: whereCondition,
			relations: {
				user: true,
				answers: {
					question: true,
					player: true,
				},
			},
		})

		return {
			code: LayerSuccessCode.Success,
			data: getPlayerRes.map(this.mapDbGamePlayerToServiceGamePlayer),
		}
	}

	async getTopStatistics(
		query: GetTopStatisticQueries,
	): Promise<LayerResult<TopStatisticsOutModel>> {
		const totalPlayersQuery =
			'SELECT COUNT(*) as "totalPlayers" FROM game_player GROUP BY "userId"'
		const totalPlayersRes = await this.dataSource.query(totalPlayersQuery)
		const totalPlayersCount = +totalPlayersRes.length

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10
		const pagesCount = Math.ceil(totalPlayersCount / pageSize)

		// console.log(query.sort)
		const sortRawArr: string[] = []
		if (query.sort) {
			if (typeof query.sort === 'string') {
				sortRawArr.push(query.sort)
			} else {
				sortRawArr.push(...query.sort)
			}
		}
		sortRawArr.push('avgScores desc', 'sumScore desc')
		const sortRawSet = new Set(sortRawArr)

		// ['avgScores desc', 'sumScore desc'] -> ['"avgScores" DESC', '"sumScore" DESC']
		const preparedSortArr = Array.from(sortRawSet).map((sortByAndDirectionStr) => {
			const [sortBy, sortDirection] = sortByAndDirectionStr.split(' ')
			return `"${sortBy}" ${sortDirection.toUpperCase()}`
		})

		const topStatisticsOnPageQuery = `
			SELECT
			"userId",
			(SELECT SUM(score) FROM game_player WHERE game_player."userId" = gp."userId") as "sumScore",
			(
				(SELECT CAST(SUM(score) AS DECIMAL) FROM game_player WHERE game_player."userId" = gp."userId")
				/
				(SELECT CAST(COUNT("userId") AS DECIMAL) FROM game_player WHERE game_player."userId" = gp."userId")
			) as "avgScores",
			(SELECT COUNT("userId") FROM game_player WHERE game_player."userId" = gp."userId") as "gamesCount",
			(SELECT COUNT("isPlayerWinning") FROM game_player WHERE game_player."userId" = gp."userId" AND game_player."isPlayerWinning" = true) as "winsCount",
			(SELECT COUNT("isPlayerLossing") FROM game_player WHERE game_player."userId" = gp."userId" AND game_player."isPlayerLossing" = true) as "lossesCount",
			(SELECT COUNT("isPlayerDrawing") FROM game_player WHERE game_player."userId" = gp."userId" AND game_player."isPlayerDrawing" = true) as "drawsCount",
			(SELECT "login" FROM public."user" u WHERE u.id = gp."userId") as login
			FROM game_player gp
			GROUP BY "userId"
			ORDER BY ${preparedSortArr.join(', ')}
			LIMIT ${pageSize}
			OFFSET ${(pageNumber - 1) * pageSize}
		`

		const statisticsRes: any[] = await this.dataSource.query(topStatisticsOnPageQuery)
		statisticsRes.forEach((stats) => {
			stats.avgScores = truncateFloatNumber(+stats.avgScores, 2)
		})

		return {
			code: LayerSuccessCode.Success,
			data: {
				pagesCount,
				page: pageNumber,
				pageSize,
				totalCount: totalPlayersCount,
				items: statisticsRes.map((stats) => {
					return {
						sumScore: +stats.sumScore,
						avgScores: stats.avgScores,
						gamesCount: +stats.gamesCount,
						winsCount: +stats.winsCount,
						lossesCount: +stats.lossesCount,
						drawsCount: +stats.drawsCount,
						player: {
							id: stats.userId.toString(),
							login: stats.login,
						},
					}
				}),
			},
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
