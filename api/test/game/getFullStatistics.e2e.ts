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

		it.only('should return 4 games', async () => {
			const [firstAccessToken, firstUserId] = await userUtils.createUniqueUserAndLogin(app)
			const [secondAccessToken, secondUserId] = await userUtils.createUniqueUserAndLogin(app)

			// The first user give 5 correct answers, but his rival give 0
			await gameUtils.createGameAndGaveAnswers(app, {
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
			await gameUtils.createGameAndGaveAnswers(app, {
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
			await gameUtils.createGameAndGaveAnswers(app, {
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
			await gameUtils.createGameAndGaveAnswers(app, {
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
			await gameUtils.createGameAndGaveAnswers(app, {
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
					// expect(userStats.winsCount).toBe(0)
					// expect(userStats.lossesCount).toBe(0)
					// expect(userStats.drawsCount).toBe(0)
				} else if (i === 1) {
					expect(userStats.sumScore).toBe(10)
					expect(userStats.avgScores).toBe(2.5)
					expect(userStats.gamesCount).toBe(4)
					// expect(userStats.winsCount).toBe(0)
					// expect(userStats.lossesCount).toBe(0)
					// expect(userStats.drawsCount).toBe(0)
				} else if (i === 2) {
					expect(userStats.sumScore).toBe(6)
					expect(userStats.avgScores).toBe(6)
					expect(userStats.gamesCount).toBe(1)
					// expect(userStats.winsCount).toBe(0)
					// expect(userStats.lossesCount).toBe(0)
					// expect(userStats.drawsCount).toBe(0)
				} else if (i === 3) {
					expect(userStats.sumScore).toBe(0)
					expect(userStats.avgScores).toBe(0)
					expect(userStats.gamesCount).toBe(1)
					// expect(userStats.winsCount).toBe(0)
					// expect(userStats.lossesCount).toBe(0)
					// expect(userStats.drawsCount).toBe(0)
				}
			}

			// console.log(JSON.stringify(getStatisticsRes.body))
		})

		/*it('should return full statistics of user`s games', async () => {
			const getUserStatisticsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.TOP.full)
				.set('authorization', 'Bearer ' + firstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			expect(getUserStatisticsRes.body.sumScore).toBe(12)
			expect(getUserStatisticsRes.body.avgScores).toBe(4)
			expect(getUserStatisticsRes.body.gamesCount).toBe(3)
			expect(getUserStatisticsRes.body.winsCount).toBe(2)
			expect(getUserStatisticsRes.body.lossesCount).toBe(1)
			expect(getUserStatisticsRes.body.drawsCount).toBe(0)
		})*/
	})
})

const f = {
	pagesCount: 1,
	page: 1,
	pageSize: 10,
	totalCount: 10,
	items: [
		{
			sumScore: 10,
			avgScores: 2,
			gamesCount: 4,
			winsCount: 1,
			lossesCount: 1,
			drawsCount: 2,
			player: { id: '330', login: 'xdcqtc1w' },
		},
		{
			sumScore: 12,
			avgScores: 3,
			gamesCount: 4,
			winsCount: 1,
			lossesCount: 1,
			drawsCount: 2,
			player: { id: '329', login: 'dp7zrxb6' },
		},
		{
			sumScore: 0,
			avgScores: 0,
			gamesCount: 1,
			winsCount: 0,
			lossesCount: 1,
			drawsCount: 0,
			player: { id: '328', login: 'tp4qhsdk' },
		},
		{
			sumScore: 6,
			avgScores: 6,
			gamesCount: 1,
			winsCount: 1,
			lossesCount: 0,
			drawsCount: 0,
			player: { id: '327', login: 'omy6kr44' },
		},
	],
}
