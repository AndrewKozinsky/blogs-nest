import { INestApplication } from '@nestjs/common'
// import { agent as request } from 'supertest'
import { Response } from 'express'
import { GameStatus } from '../../src/db/pg/entities/game/game'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { createTestApp } from '../utils/common'
import { clearAllDB } from '../utils/db'
import {
	addQuizQuestionRequest,
	addUserByAdminRequest,
	loginRequest,
	userEmail,
	userPassword,
} from '../utils/utils'
import { agent as request } from 'supertest'
import { checkGameObj, createGameQuestions } from './common'

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

			checkGameObj(connectToGameRes.body)

			expect(connectToGameRes.body.firstPlayerProgress.answers.length).toBe(0)
			expect(connectToGameRes.body.firstPlayerProgress.score).toBe(0)
			expect(connectToGameRes.body.secondPlayerProgress).toBe(null)
			expect(connectToGameRes.body.questions.length).toBe(0)
			expect(connectToGameRes.body.status).toBe(GameStatus.Pending)
			expect(connectToGameRes.body.startGameDate).toBe(null)
			expect(connectToGameRes.body.finishGameDate).toBe(null)
		})

		it.only('should return an object if the second user connected to the game', async () => {
			await createGameQuestions(app, 10)

			// Create a first user
			const createdFirstUserRes = await addUserByAdminRequest(app, {
				email: 'email-1@email.com',
				login: 'login-1',
				password: 'password-1',
			})
			expect(createdFirstUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserFirstRes = await loginRequest(app, 'email-1@email.com', 'password-1')
			const userFirstAccessToken = loginUserFirstRes.body.accessToken

			// First user connects to the game
			const firstConnectToGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.CONNECTION.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)
			expect(firstConnectToGameRes.body.questions.length).toBe(0)

			// -----

			// Create a second user
			const createdSecondUserRes = await addUserByAdminRequest(app, {
				email: 'email-2@email.com',
				login: 'login-2',
				password: 'password-2',
			})
			expect(createdSecondUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserSecondRes = await loginRequest(app, 'email-2@email.com', 'password-2')
			const userSecondAccessToken = loginUserSecondRes.body.accessToken

			// Second user connects to the game
			const secondConnectToGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.CONNECTION.full)
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			checkGameObj(secondConnectToGameRes.body)
			expect(secondConnectToGameRes.body.secondPlayerProgress).not.toBe(null)
			expect(secondConnectToGameRes.body.status).toBe(GameStatus.Active)
			expect(secondConnectToGameRes.body.questions.length).toBe(5)
		})
	})
})
