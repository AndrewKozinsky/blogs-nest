import { INestApplication } from '@nestjs/common'
import { GameStatus } from '../../src/db/pg/entities/game/game'
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

	describe('Returns all my games (closed games and current)', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_GAMES.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return object with empty array if an user have not games', async () => {
			const [userAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			const getUserGamesRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_GAMES.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			expect(getUserGamesRes.body.pagesCount).toBe(0)
			expect(getUserGamesRes.body.page).toBe(1)
			expect(getUserGamesRes.body.pageSize).toBe(10)
			expect(getUserGamesRes.body.totalCount).toBe(0)
			expect(getUserGamesRes.body.items.length).toBe(0)
		})

		it('should return object with array of games', async () => {
			const [firstAccessToken, firstUserId] = await userUtils.createUniqueUserAndLogin(app)
			const [secondAccessToken, secondUserId] = await userUtils.createUniqueUserAndLogin(app)

			await gameUtils.createGameAndFinish(app, firstAccessToken, secondAccessToken)
			await gameUtils.createGameAndFinish(app, firstAccessToken, secondAccessToken)
			await gameUtils.createGameAndFinish(app, firstAccessToken, secondAccessToken)
			await gameUtils.createGameAndGiveTwoAnswers(app, firstAccessToken, secondAccessToken)

			const getUserGamesRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_GAMES.full)
				.set('authorization', 'Bearer ' + firstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			expect(getUserGamesRes.body.pagesCount).toBe(1)
			expect(getUserGamesRes.body.page).toBe(1)
			expect(getUserGamesRes.body.pageSize).toBe(10)
			expect(getUserGamesRes.body.totalCount).toBe(4)
			expect(getUserGamesRes.body.items.length).toBe(4)
		})

		it('should return object with array of games if many users', async () => {
			const [userFirstAccessToken, firstUserId] =
				await userUtils.createUniqueUserAndLogin(app)
			const [userSecondAccessToken, secondUserId] =
				await userUtils.createUniqueUserAndLogin(app)
			const [userThirdAccessToken, thirdUserId] =
				await userUtils.createUniqueUserAndLogin(app)
			const [userFourthAccessToken, fourthUserId] =
				await userUtils.createUniqueUserAndLogin(app)

			await gameUtils.createGameAndFinish(app, userFirstAccessToken, userSecondAccessToken)
			await gameUtils.createGameAndFinish(app, userThirdAccessToken, userFourthAccessToken)
			await gameUtils.createGameAndFinish(app, userFirstAccessToken, userSecondAccessToken)
			await gameUtils.createGameAndFinish(app, userThirdAccessToken, userFourthAccessToken)
			await gameUtils.createGameAndGiveTwoAnswers(
				app,
				userFirstAccessToken,
				userSecondAccessToken,
			)

			const getUserGamesRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_GAMES.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			expect(getUserGamesRes.body.pagesCount).toBe(1)
			expect(getUserGamesRes.body.page).toBe(1)
			expect(getUserGamesRes.body.pageSize).toBe(10)
			expect(getUserGamesRes.body.totalCount).toBe(3)
			expect(getUserGamesRes.body.items.length).toBe(3)
		})

		it('games takes many pages', async () => {
			const [userFirstAccessToken, firstUserId] =
				await userUtils.createUniqueUserAndLogin(app)
			const [userSecondAccessToken, secondUserId] =
				await userUtils.createUniqueUserAndLogin(app)

			for (let i = 0; i < 10; i++) {
				await gameUtils.createGameAndFinish(
					app,
					userFirstAccessToken,
					userSecondAccessToken,
				)
			}

			const getUserGamesRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_GAMES.full + '?pageNumber=2&pageSize=3')
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			expect(getUserGamesRes.body.pagesCount).toBe(4)
			expect(getUserGamesRes.body.page).toBe(2)
			expect(getUserGamesRes.body.pageSize).toBe(3)
			expect(getUserGamesRes.body.totalCount).toBe(10)
			expect(getUserGamesRes.body.items.length).toBe(3)
		})

		it('check games array default sorting', async () => {
			const [userFirstAccessToken, firstUserId] =
				await userUtils.createUniqueUserAndLogin(app)
			const [userSecondAccessToken, secondUserId] =
				await userUtils.createUniqueUserAndLogin(app)

			for (let i = 0; i < 10; i++) {
				await gameUtils.createGameAndFinish(
					app,
					userFirstAccessToken,
					userSecondAccessToken,
				)
			}

			const getUserGamesRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_GAMES.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Check sorting by pairCreatedDate prop in DESC order
			for (let i = 0; i < getUserGamesRes.body.items.length; i++) {
				if (i === 0) continue

				const prevGame = getUserGamesRes.body.items[i - 1]
				const thisGame = getUserGamesRes.body.items[i]

				expect(prevGame.pairCreatedDate > thisGame.pairCreatedDate).toBe(true)
			}
		})

		it.only('games array must be sorted by status field', async () => {
			const [userFirstAccessToken, firstUserId] =
				await userUtils.createUniqueUserAndLogin(app)
			const [userSecondAccessToken, secondUserId] =
				await userUtils.createUniqueUserAndLogin(app)

			for (let i = 0; i < 3; i++) {
				await gameUtils.createGameAndFinish(
					app,
					userFirstAccessToken,
					userSecondAccessToken,
				)
			}

			await gameUtils.createGameAndGiveTwoAnswers(
				app,
				userFirstAccessToken,
				userSecondAccessToken,
			)

			const getUserGamesRes = await request(app.getHttpServer())
				.get(
					'/' +
						RouteNames.PAIR_GAME.PAIRS.MY_GAMES.full +
						'?sortBy=status&sortDirection=asc',
				)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Check that the first game has status Active, and last have status Finished
			for (let i = 0; i < getUserGamesRes.body.items.length; i++) {
				const thisGame = getUserGamesRes.body.items[i]

				if (i === 0) {
					expect(thisGame.status).toBe(GameStatus.Active)
					continue
				}

				expect(thisGame.status).toBe(GameStatus.Finished)
			}

			// Check sorting by pairCreatedDate prop in games from 2 till 4
			for (let i = 1; i < getUserGamesRes.body.items.length; i++) {
				if (i === 0) continue

				const prevGame = getUserGamesRes.body.items[i - 1]
				const thisGame = getUserGamesRes.body.items[i]

				expect(prevGame.pairCreatedDate > thisGame.pairCreatedDate).toBe(true)
			}
		})
	})
})
