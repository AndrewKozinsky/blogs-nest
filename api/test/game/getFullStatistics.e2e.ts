import { INestApplication } from '@nestjs/common'
import { GameStatus } from '../../src/db/pg/entities/game/game'
import { GetBlogsOutModel } from '../../src/features/blogs/blogs/model/blogs.output.model'
import { gameConfig } from '../../src/features/pairGame/config'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { createTestApp } from '../utils/common'
import { clearAllDB } from '../utils/db'
import { gameUtils } from '../utils/gameUtils'
import { userUtils } from '../utils/userUtils'
import { agent as request } from 'supertest'

it('123', async () => {
	expect(2).toBe(2)
})

describe('ROOT', () => {
	let app: INestApplication

	beforeAll(async () => {
		app = await createTestApp()
	})

	beforeEach(async () => {
		await clearAllDB(app)
	})

	describe('All games statistics', () => {
		it('should return blank statistics there are not games', async () => {
			const successAnswer: GetBlogsOutModel = {
				pagesCount: 0,
				page: 1,
				pageSize: 10,
				totalCount: 0,
				items: [],
			}

			const getStatisticsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.TOP.full)
				.expect(HTTP_STATUSES.OK_200)

			expect(getStatisticsRes.body).toEqual(successAnswer)
		})

		it('should return 4 games', async () => {
			const [firstAccessToken, firstUserId] = await userUtils.createUniqueUserAndLogin(app)
			const [secondAccessToken, secondUserId] = await userUtils.createUniqueUserAndLogin(app)

			// The first user gives 5 correct answers, but his rival gives 0
			await gameUtils.createGameAndQuestionsAndPlayersAndGaveAnswers(app, {
				firstPlayer: {
					accessToken: firstAccessToken,
					correctAnswers: gameConfig.questionsNumber,
					wrongAnswers: 0,
				},
				secondPlayer: {
					accessToken: secondAccessToken,
					correctAnswers: 0,
					wrongAnswers: gameConfig.questionsNumber,
				},
			})
			// The first user give 0 correct answers, but his rival give 5
			await gameUtils.createGameAndQuestionsAndPlayersAndGaveAnswers(app, {
				firstPlayer: {
					accessToken: firstAccessToken,
					correctAnswers: 0,
					wrongAnswers: gameConfig.questionsNumber,
				},
				secondPlayer: {
					accessToken: secondAccessToken,
					correctAnswers: gameConfig.questionsNumber,
					wrongAnswers: 0,
				},
			})
			// The first and second users give 3 correct answers and 2 wrong ones
			// The first player won because he answered quicker
			await gameUtils.createGameAndQuestionsAndPlayersAndGaveAnswers(app, {
				firstPlayer: {
					accessToken: firstAccessToken,
					correctAnswers: 3,
					wrongAnswers: gameConfig.questionsNumber - 3,
				},
				secondPlayer: {
					accessToken: secondAccessToken,
					correctAnswers: 3,
					wrongAnswers: gameConfig.questionsNumber - 3,
				},
			})
			// The first and second players give only 2 correct answers
			await gameUtils.createGameAndQuestionsAndPlayersAndGaveAnswers(app, {
				firstPlayer: {
					accessToken: firstAccessToken,
					correctAnswers: 2,
					wrongAnswers: 0,
				},
				secondPlayer: {
					accessToken: secondAccessToken,
					correctAnswers: 2,
					wrongAnswers: 0,
				},
			})

			// -------------

			const [thirdUserAccessToken, thirdUserUserId] =
				await userUtils.createUniqueUserAndLogin(app)
			const [forthUserAccessToken, forthUserUserId] =
				await userUtils.createUniqueUserAndLogin(app)

			// The first user give 5 correct answers, but his rival give 0
			await gameUtils.createGameAndQuestionsAndPlayersAndGaveAnswers(app, {
				firstPlayer: {
					accessToken: thirdUserAccessToken,
					correctAnswers: gameConfig.questionsNumber,
					wrongAnswers: 0,
				},
				secondPlayer: {
					accessToken: forthUserAccessToken,
					correctAnswers: 0,
					wrongAnswers: gameConfig.questionsNumber,
				},
			})

			// -------------

			const getStatisticsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.TOP.full + '?sort=userId asc')
				.expect(HTTP_STATUSES.OK_200)

			expect(getStatisticsRes.body.pagesCount).toBe(1)
			expect(getStatisticsRes.body.page).toBe(1)
			expect(getStatisticsRes.body.pageSize).toBe(10)
			expect(getStatisticsRes.body.totalCount).toBe(10)
			expect(getStatisticsRes.body.items.length).toBe(4)

			for (let i = 0; i < getStatisticsRes.body.items.length; i++) {
				const userStats = getStatisticsRes.body.items[i]
				gameUtils.checkTopStatisticUserItem(userStats)

				if (i === 0) {
					expect(userStats.sumScore).toBe(12)
					expect(userStats.avgScores).toBe(3)
					expect(userStats.gamesCount).toBe(4)
					expect(userStats.winsCount).toBe(2)
					expect(userStats.lossesCount).toBe(1)
					expect(userStats.drawsCount).toBe(1)
				} else if (i === 1) {
					expect(userStats.sumScore).toBe(10)
					expect(userStats.avgScores).toBe(2.5)
					expect(userStats.gamesCount).toBe(4)
					expect(userStats.winsCount).toBe(1)
					expect(userStats.lossesCount).toBe(2)
					expect(userStats.drawsCount).toBe(1)
				} else if (i === 2) {
					expect(userStats.sumScore).toBe(6)
					expect(userStats.avgScores).toBe(6)
					expect(userStats.gamesCount).toBe(1)
					expect(userStats.winsCount).toBe(1)
					expect(userStats.lossesCount).toBe(0)
					// expect(userStats.drawsCount).toBe(0)
				} else if (i === 3) {
					expect(userStats.sumScore).toBe(0)
					expect(userStats.avgScores).toBe(0)
					expect(userStats.gamesCount).toBe(1)
					expect(userStats.winsCount).toBe(0)
					expect(userStats.lossesCount).toBe(1)
					expect(userStats.drawsCount).toBe(0)
				}
			}
		})

		it('should return statiscist with paginating', async () => {
			for (let i = 0; i < 4; i++) {
				const [firstAccessToken, firstUserId] =
					await userUtils.createUniqueUserAndLogin(app)
				const [secondAccessToken, secondUserId] =
					await userUtils.createUniqueUserAndLogin(app)

				// The first user gives 2 correct answers, but his rival gives 4
				await gameUtils.createGameAndQuestionsAndPlayersAndGaveAnswers(app, {
					firstPlayer: {
						accessToken: firstAccessToken,
						correctAnswers: 2,
						wrongAnswers: gameConfig.questionsNumber - 2,
					},
					secondPlayer: {
						accessToken: secondAccessToken,
						correctAnswers: 4,
						wrongAnswers: gameConfig.questionsNumber - 4,
					},
				})
			}

			const getStatsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.TOP.full + '?pageNumber=2&pageSize=2')
				.expect(HTTP_STATUSES.OK_200)

			expect(getStatsRes.body.pagesCount).toBe(4)
			expect(getStatsRes.body.page).toBe(2)
			expect(getStatsRes.body.pageSize).toBe(2)
			expect(getStatsRes.body.totalCount).toBe(8)
			expect(getStatsRes.body.items.length).toBe(2)
		})

		it('should sort by games count', async () => {
			const [firstAccessToken, firstUserId] = await userUtils.createUniqueUserAndLogin(app)
			const [secondAccessToken, secondUserId] = await userUtils.createUniqueUserAndLogin(app)

			for (let i = 0; i < 3; i++) {
				// The first user gives 5 correct answers, but his rival gives 0
				await gameUtils.createGameAndQuestionsAndPlayersAndGaveAnswers(app, {
					firstPlayer: {
						accessToken: firstAccessToken,
						correctAnswers: gameConfig.questionsNumber,
						wrongAnswers: 0,
					},
					secondPlayer: {
						accessToken: secondAccessToken,
						correctAnswers: 0,
						wrongAnswers: gameConfig.questionsNumber,
					},
				})
			}

			// -------------

			const [thirdUserAccessToken, thirdUserUserId] =
				await userUtils.createUniqueUserAndLogin(app)
			const [forthUserAccessToken, forthUserUserId] =
				await userUtils.createUniqueUserAndLogin(app)

			// The first user give 5 correct answers, but his rival give 0
			await gameUtils.createGameAndQuestionsAndPlayersAndGaveAnswers(app, {
				firstPlayer: {
					accessToken: thirdUserAccessToken,
					correctAnswers: gameConfig.questionsNumber,
					wrongAnswers: 0,
				},
				secondPlayer: {
					accessToken: forthUserAccessToken,
					correctAnswers: 0,
					wrongAnswers: gameConfig.questionsNumber,
				},
			})

			// -------------

			const getStatisticsByGamesCountAscRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.TOP.full + '?sort=gamesCount asc')
				.expect(HTTP_STATUSES.OK_200)

			expect(getStatisticsByGamesCountAscRes.body.items[0].gamesCount).toBe(1)
			expect(getStatisticsByGamesCountAscRes.body.items[1].gamesCount).toBe(1)
			expect(getStatisticsByGamesCountAscRes.body.items[0].gamesCount).toBe(3)
			expect(getStatisticsByGamesCountAscRes.body.items[1].gamesCount).toBe(3)

			const getStatisticsByGamesCountDescRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.TOP.full + '?sort=gamesCount desc')
				.expect(HTTP_STATUSES.OK_200)

			expect(getStatisticsByGamesCountDescRes.body.items[0].gamesCount).toBe(3)
			expect(getStatisticsByGamesCountDescRes.body.items[1].gamesCount).toBe(3)
			expect(getStatisticsByGamesCountDescRes.body.items[2].gamesCount).toBe(1)
			expect(getStatisticsByGamesCountDescRes.body.items[3].gamesCount).toBe(1)
		})

		it.only('should sort by games count', async () => {
			const getStatisticsByGamesCountAscRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.TOP.full + '?sort=wrongProp asc')
				.expect(HTTP_STATUSES.OK_200)
		})
	})
})
