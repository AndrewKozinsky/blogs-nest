import { INestApplication } from '@nestjs/common'
import { DBTypes } from '../../src/db/mongo/dbTypes'
import { GameStatus } from '../../src/db/pg/entities/game/game'
import { gameConfig } from '../../src/features/pairGame/config'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { createTestApp } from '../utils/common'
import { clearAllDB } from '../utils/db'
import {
	addQuestionRequest,
	addUserByAdminRequest,
	loginRequest,
	userEmail,
	userPassword,
} from '../utils/utils'
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

	describe('Get a game by id', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.GAME_ID('33').full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 403 if current user is not a player', async () => {
			const [userFirstAccessToken, userSecondAccessToken, game] =
				await createGameWithPlayers(app)

			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userAccessToken = loginUserRes.body.accessToken

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.GAME_ID(game.id).full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('should return 400 if game not exists', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userAccessToken = loginUserRes.body.accessToken

			const connectToGameRes = await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.GAME_ID('incorrect_id_format').full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('only one player has joined to the game', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userAccessToken = loginUserRes.body.accessToken

			const connectToGameRes = await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)
			const game = connectToGameRes.body

			const getGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.GAME_ID(game.id).full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const game2 = getGameRes.body
			checkGameObj(game2)

			expect(game2.firstPlayerProgress.answers.length).toBe(0)
			expect(game2.firstPlayerProgress.score).toBe(0)
			expect(game2.secondPlayerProgress).toBe(null)
			expect(game2.questions).toBe(null)
			expect(game2.status).toBe(GameStatus.Pending)
			expect(game2.startGameDate).toBe(null)
			expect(game2.finishGameDate).toBe(null)
		})

		it('two players have joined to the game', async () => {
			const [userFirstAccessToken, userSecondAccessToken, game] =
				await createGameWithPlayers(app)

			const getGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.GAME_ID(game.id).full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const game2 = getGameRes.body
			checkGameObj(game2)
			expect(game2.secondPlayerProgress).not.toBe(null)
			expect(game2.status).toBe(GameStatus.Active)
			expect(game2.questions.length).toBe(5)
		})
	})
})
