import { INestApplication } from '@nestjs/common'
import { GameStatus } from '../../src/db/pg/entities/game/game'
import { gameConfig } from '../../src/features/pairGame/config'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { createTestApp } from '../utils/common'
import { clearAllDB } from '../utils/db'
import { gameUtils } from '../utils/gameUtils'
import { userUtils } from '../utils/userUtils'
import { agent as request } from 'supertest'

it.only('123', async () => {
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

	describe('Returns all my games (closed games and current)', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.MY_STATISTIC.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return blank statistics if an user have not games', async () => {
			const [userAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			const getUserStatisticsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.MY_STATISTIC.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			expect(getUserStatisticsRes.body.sumScore).toBe(0)
			expect(getUserStatisticsRes.body.avgScores).toBe(0)
			expect(getUserStatisticsRes.body.gamesCount).toBe(0)
			expect(getUserStatisticsRes.body.winsCount).toBe(0)
			expect(getUserStatisticsRes.body.lossesCount).toBe(0)
			expect(getUserStatisticsRes.body.drawsCount).toBe(0)
		})

		it('should return full statistics of user`s games', async () => {
			const [otherUser1AccessToken, otherUser1UserId] =
				await userUtils.createUniqueUserAndLogin(app)
			const [otherUser2AccessToken, otherUser2UserId] =
				await userUtils.createUniqueUserAndLogin(app)

			// The first user give 5 correct answers, but his rival give 0
			await gameUtils.createGameAndGaveAnswers(app, {
				firstPlayer: {
					accessToken: otherUser1AccessToken,
					correctAnswers: gameConfig.questionsNumber,
					wrongAnswers: 0,
				},
				secondPlayer: {
					accessToken: otherUser2AccessToken,
					correctAnswers: 0,
					wrongAnswers: gameConfig.questionsNumber,
				},
			})

			// -------------

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

			const getUserStatisticsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.USERS.MY_STATISTIC.full)
				.set('authorization', 'Bearer ' + firstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			expect(getUserStatisticsRes.body.sumScore).toBe(12)
			expect(getUserStatisticsRes.body.avgScores).toBe(4)
			expect(getUserStatisticsRes.body.gamesCount).toBe(3)
			expect(getUserStatisticsRes.body.winsCount).toBe(2)
			expect(getUserStatisticsRes.body.lossesCount).toBe(1)
			expect(getUserStatisticsRes.body.drawsCount).toBe(0)
		})
	})
})
