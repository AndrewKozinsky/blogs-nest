import { INestApplication } from '@nestjs/common'
import { DBTypes } from '../../src/db/mongo/dbTypes'
import { GameStatus } from '../../src/db/pg/entities/game/game'
import { gameConfig } from '../../src/features/pairGame/config'
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

	describe('Answer game question', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 403 if current user pass wrong body', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userAccessToken = loginUserRes.body.accessToken

			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it.only('should return 403 if current user is not a player', async () => {
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

			// -----

			// Give 5 answers by second user
			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				const res = await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'My wrong answer' })
					.set('authorization', 'Bearer ' + userSecondAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}

			// Try to answer one more time to check for forbidden status
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'My wrong answer' })
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.FORBIDDEN_403)

			// Check score !!!
		})
		// Проверь добавляется ли дополнительный балл игроку закончившему игру раньше и ответившего как минимум на один вопрос.
	})
})
