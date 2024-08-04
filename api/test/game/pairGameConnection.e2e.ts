import { INestApplication } from '@nestjs/common'
import { GameStatus } from '../../src/db/pg/entities/game/game'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { createTestApp } from '../utils/common'
import { clearAllDB } from '../utils/db'
import { addUserByAdminRequest, loginRequest, userEmail, userPassword } from '../utils/utils'
import { agent as request } from 'supertest'
import { checkGameObj, createGameQuestions, createGameWithPlayers } from './common'

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

	describe('Connection to a game', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.CONNECTION.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 403 if current user is already participating in active pair', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userAccessToken = loginUserRes.body.accessToken

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('should return an object without questions if a single user connected to the empty game', async () => {
			await createGameQuestions(app, 10)

			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userAccessToken = loginUserRes.body.accessToken

			const connectToGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const game = connectToGameRes.body
			checkGameObj(connectToGameRes.body)

			expect(game.firstPlayerProgress.answers.length).toBe(0)
			expect(game.firstPlayerProgress.score).toBe(0)
			expect(game.secondPlayerProgress).toBe(null)
			expect(game.questions.length).toBe(0)
			expect(game.status).toBe(GameStatus.Pending)
			expect(game.startGameDate).toBe(null)
			expect(game.finishGameDate).toBe(null)
		})

		it('should return an object if the second user connected to the game', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

			checkGameObj(game)
			expect(game.secondPlayerProgress).not.toBe(null)
			expect(game.status).toBe(GameStatus.Active)
			expect(game.questions.length).toBe(5)
		})
	})
})
