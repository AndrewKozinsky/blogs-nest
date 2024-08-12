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
import {
	checkGameObj,
	createGameQuestions,
	createGameWithAnotherPlayers,
	createGameWithPlayers,
} from './common'

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
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 403 if current user pass wrong body', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userAccessToken = loginUserRes.body.accessToken

			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should return 403 if to try 6-th answer', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

			// Give 5 answers by second user
			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				const res = await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'My wrong answer' })
					.set('authorization', 'Bearer ' + userSecondAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}

			// Try to answer one more time to check for Unauthorized status
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'My wrong answer' })
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('first and second players gave a few answers', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

			// First player gave correct answer
			const answer1Req = request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'Answer 1' })
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Second player gave incorrect answer
			const answer2Req = request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'Wrong answer' })
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Second player gave correct answer
			const answer3Req = request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'Answer 1' })
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			await Promise.all([answer1Req, answer2Req, answer3Req])

			const getFirstPlayerGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const getSecondPlayerGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Check user 1 has score 1 and user 2 has score 2
			const updatedGame = getFirstPlayerGameRes.body
			expect(updatedGame.status).toBe(GameStatus.Active)
			expect(updatedGame.firstPlayerProgress.score).toBe(1)
			expect(updatedGame.firstPlayerProgress.answers.length).toBe(1)

			expect(updatedGame.secondPlayerProgress.score).toBe(1)
			expect(updatedGame.secondPlayerProgress.answers.length).toBe(2)

			expect(typeof updatedGame.startGameDate).toBe('string')
			expect(updatedGame.finishGameDate).toBe(null)
		})

		it('first player has finished game, but second not', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

			// First player gave 3 wrong answers
			for (let i = 0; i < gameConfig.questionsNumber - 2; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Wrong answer' })
					.set('authorization', 'Bearer ' + userFirstAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}
			// First player gave 2 right answers
			for (let i = 0; i < 2; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Answer 1' })
					.set('authorization', 'Bearer ' + userFirstAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}

			// Second player gave 3 right answers
			for (let i = 0; i < gameConfig.questionsNumber - 2; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Answer 1' })
					.set('authorization', 'Bearer ' + userSecondAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}

			// Check user 1 has score 2 and user 2 has score 4
			const getGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.GAME_ID(game.id).full)
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const updatedGame = getGameRes.body
			expect(updatedGame.status).toBe(GameStatus.Active)
			expect(updatedGame.firstPlayerProgress.score).toBe(2)
			expect(updatedGame.firstPlayerProgress.answers.length).toBe(5)

			expect(updatedGame.secondPlayerProgress.score).toBe(3)
			expect(updatedGame.secondPlayerProgress.answers.length).toBe(3)

			expect(typeof updatedGame.startGameDate).toBe('string')
			expect(updatedGame.finishGameDate).toBe(null)
		})

		it('players have finished game and started another', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

			// Give 4 answers by first and second user
			// First user give no right answers, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber - 1; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Wrong answer' })
					.set('authorization', 'Bearer ' + userFirstAccessToken)
					.expect(HTTP_STATUSES.OK_200)

				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Answer 1' })
					.set('authorization', 'Bearer ' + userSecondAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}

			// First player gave 1 correct answer
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'Answer 1' })
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Second player gave 1 correct answer
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'Answer 1' })
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Get the game
			const getGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.GAME_ID(game.id).full)
				.send({ answer: 'Answer 1' })
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Check user 1 has score 2 and user 2 has score 5
			const updatedGame = getGameRes.body
			expect(updatedGame.status).toBe(GameStatus.Finished)
			expect(updatedGame.firstPlayerProgress.score).toBe(2)
			expect(updatedGame.secondPlayerProgress.score).toBe(5)
			expect(typeof updatedGame.startGameDate).toBe('string')
			expect(typeof updatedGame.finishGameDate).toBe('string')

			// RUN A NEW GAME

			// Create a third user
			const createdThirdUserRes = await addUserByAdminRequest(app, {
				email: 'email-3@email.com',
				login: 'login-3',
				password: 'password-3',
			})
			expect(createdThirdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserFirstRes = await loginRequest(app, 'email-3@email.com', 'password-3')
			const userThirdAccessToken = loginUserFirstRes.body.accessToken

			// Get the game by first user
			const getGameByFirstPlayerRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)

			// Get the game by second user
			const getGameByThirdPlayerRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userThirdAccessToken)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('players does not finished game and another started a new one', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

			// Give 4 answers by first and second user
			// First user give no right answers, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber - 2; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Wrong answer' })
					.set('authorization', 'Bearer ' + userFirstAccessToken)
					.expect(HTTP_STATUSES.OK_200)

				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Answer 1' })
					.set('authorization', 'Bearer ' + userSecondAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}

			// New players RUN A NEW GAME

			const { userThirdAccessToken, userFourthAccessToken } =
				await createGameWithAnotherPlayers(app)

			// Third and fourth players gave one answer each
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'Wrong answer' })
				.set('authorization', 'Bearer ' + userThirdAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'Answer 1' })
				.set('authorization', 'Bearer ' + userFourthAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// First and second players gave one answer each
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'Answer 1' })
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.send({ answer: 'Wrong answer' })
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)
		})

		it('players finished one game and another', async () => {
			const { userFirstAccessToken, userSecondAccessToken, game } =
				await createGameWithPlayers(app)

			// Give all answers by first and second user
			// First user give no right answers, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Wrong answer' })
					.set('authorization', 'Bearer ' + userFirstAccessToken)
					.expect(HTTP_STATUSES.OK_200)

				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Answer 1' })
					.set('authorization', 'Bearer ' + userSecondAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}

			// First user connects to the new game
			const firstConnectToGameRes = await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Second user connects to the game
			const secondConnectToGameRes = await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Give all answers by first and second user
			// First user give no right answers, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Wrong answer' })
					.set('authorization', 'Bearer ' + userFirstAccessToken)
					.expect(HTTP_STATUSES.OK_200)

				await request(app.getHttpServer())
					.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
					.send({ answer: 'Answer 1' })
					.set('authorization', 'Bearer ' + userSecondAccessToken)
					.expect(HTTP_STATUSES.OK_200)
			}
		})
	})
})
