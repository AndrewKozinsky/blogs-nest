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

		it('should return 403 if to try 6-th answer', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

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
		})

		it('players has finished game', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

			// Give 5 answers by first and second user
			// First user give only one right answer, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Wrong answer' })
					.set('authorization', 'Bearer ' + userFirstAccessToken)
					.expect(HTTP_STATUSES.OK_200)

				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Answer 1' })
					.set('authorization', 'Bearer ' + userSecondAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}

			// Check user 1 has score 2 and user 2 has score 5
			const getGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.GAME_ID(game.id).full)
				.send({ answer: 'Answer 1' })
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const updatedGame = getGameRes.body
			expect(updatedGame.status).toBe(GameStatus.Finished)
			expect(updatedGame.firstPlayerProgress.score).toBe(0)
			expect(updatedGame.secondPlayerProgress.score).toBe(5)
			expect(typeof updatedGame.startGameDate).toBe('string')
			expect(typeof updatedGame.finishGameDate).toBe('string')
		})

		it('players has finished game', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

			// Give 5 answers by first and second user
			// First user give only one right answer, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				if (i === 0) {
					await request(app.getHttpServer())
						.post('/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.full)
						.send({ answer: 'Answer 1' })
						.set('authorization', 'Bearer ' + userFirstAccessToken)
						.expect(HTTP_STATUSES.OK_200)
				} else {
					await request(app.getHttpServer())
						.post('/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.full)
						.send({ answer: 'Wrong answer' })
						.set('authorization', 'Bearer ' + userFirstAccessToken)
						.expect(HTTP_STATUSES.OK_200)
				}

				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Answer 1' })
					.set('authorization', 'Bearer ' + userSecondAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}

			// Check user 1 has score 2 and user 2 has score 5
			const getGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.GAME_ID(game.id).full)
				.send({ answer: 'Answer 1' })
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const updatedGame = getGameRes.body
			expect(updatedGame.status).toBe(GameStatus.Finished)
			expect(updatedGame.firstPlayerProgress.score).toBe(2)
			expect(updatedGame.secondPlayerProgress.score).toBe(5)
			expect(typeof updatedGame.startGameDate).toBe('string')
			expect(typeof updatedGame.finishGameDate).toBe('string')
		})
	})
})
