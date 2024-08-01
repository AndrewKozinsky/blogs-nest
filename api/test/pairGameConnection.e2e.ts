import { agent as request } from 'supertest'
import { GameStatus } from '../src/db/pg/entities/quizGame'
import { HTTP_STATUSES } from '../src/settings/config'
import RouteNames from '../src/settings/routeNames'
import { createTestApp } from './utils/common'
import { clearAllDB } from './utils/db'
import { addUserByAdminRequest, loginRequest, userEmail, userPassword } from './utils/utils'

it.only('123', async () => {
	expect(2).toBe(2)
})

describe('ROOT', () => {
	let app: any

	beforeAll(async () => {
		app = await createTestApp()
	})

	beforeEach(async () => {
		await clearAllDB(app)
	})

	describe('Getting all quiz questions', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME_QUIZ_PAIRS.CONNECTION.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 403 if current user is already participating in active pair', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userAccessToken = loginUserRes.body.accessToken

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME_QUIZ_PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME_QUIZ_PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('should return an object if single user connected to the empty game', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userAccessToken = loginUserRes.body.accessToken

			const connectToGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME_QUIZ_PAIRS.CONNECTION.full)
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
			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME_QUIZ_PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

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
				.get('/' + RouteNames.PAIR_GAME_QUIZ_PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			checkGameObj(secondConnectToGameRes.body)
			expect(secondConnectToGameRes.body.secondPlayerProgress).not.toBe(null)
			expect(secondConnectToGameRes.body.status).toBe(GameStatus.Active)
		})
	})
})

function checkGameObj(gameObj: any) {
	expect(typeof gameObj.id).toBe('string')

	checkPlayerObj(gameObj.firstPlayerProgress)
	if (gameObj.secondPlayerProgress) {
		checkPlayerObj(gameObj.secondPlayerProgress)
	}

	checkQuestionsObj(gameObj.questions)

	expect(typeof gameObj.status).toBe('string')
	expect(typeof gameObj.pairCreatedDate).toBe('string')

	if (gameObj.startGameDate) {
		expect(typeof gameObj.startGameDate).toBe('string')
	} else {
		expect(gameObj.startGameDate).toBe(null)
	}

	if (gameObj.finishGameDate) {
		expect(typeof gameObj.finishGameDate).toBe('string')
	} else {
		expect(gameObj.finishGameDate).toBe(null)
	}
}

function checkPlayerObj(playerObj: any) {
	expect({}.toString.call(playerObj.answers)).toBe('[object Array]')

	if (playerObj.answers.length) {
		expect(typeof playerObj.answers[0].questionId).toBe('string')
		expect(typeof playerObj.answers[0].answerStatus).toBe('string')
		expect(typeof playerObj.answers[0].addedAt).toBe('string')
	}

	expect(typeof playerObj.player).toBe('object')
	expect(typeof playerObj.player.id).toBe('string')
	expect(typeof playerObj.player.login).toBe('string')
	expect(typeof playerObj.score).toBe('number')
}

function checkQuestionsObj(questions: any) {
	expect({}.toString.call(questions)).toBe('[object Array]')

	if (questions.length) {
		const questionObj = questions[0]

		expect(questionObj.id).toBe('string')
		expect(questionObj.body).toBe('string')
	}
}
