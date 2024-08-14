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

	describe('Answer game question', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 403 if current user pass wrong body', async () => {
			const [userAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should return 403 if to try 6-th answer', async () => {
			const [userFirstAccessToken, userSecondAccessToken, game] =
				await gameUtils.createGameWithPlayers(app)

			// Give 5 answers by second user
			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				await gameUtils.giveWrongAnswer(app, userFirstAccessToken)
			}

			// Try to answer one more time to check for Unauthorized status
			await gameUtils.giveCorrectAnswer(app, userSecondAccessToken)
		})

		it('first and second players gave a few answers', async () => {
			const [userFirstAccessToken, userSecondAccessToken, game] =
				await gameUtils.createGameWithPlayers(app)

			// First player gave correct answer
			const answer1Req = await gameUtils.giveCorrectAnswer(app, userFirstAccessToken)

			// Second player gave incorrect answer
			const answer2Req = await gameUtils.giveWrongAnswer(app, userSecondAccessToken)

			// Second player gave correct answer
			const answer3Req = gameUtils.giveCorrectAnswer(app, userSecondAccessToken)

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
			const [userFirstAccessToken, userSecondAccessToken, game] =
				await gameUtils.createGameWithPlayers(app)

			// First player gave 3 wrong answers
			for (let i = 0; i < gameConfig.questionsNumber - 2; i++) {
				await gameUtils.giveWrongAnswer(app, userFirstAccessToken)
			}
			// First player gave 2 right answers
			for (let i = 0; i < 2; i++) {
				await gameUtils.giveCorrectAnswer(app, userFirstAccessToken)
			}

			// Second player gave 3 right answers
			for (let i = 0; i < gameConfig.questionsNumber - 2; i++) {
				await gameUtils.giveCorrectAnswer(app, userSecondAccessToken)
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
			const [userFirstAccessToken, userSecondAccessToken, game] =
				await gameUtils.createGameWithPlayers(app)

			// Give 4 answers by first and second user
			// First user give no right answers, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber - 1; i++) {
				await gameUtils.giveWrongAnswer(app, userFirstAccessToken)
				await gameUtils.giveWrongAnswer(app, userSecondAccessToken)
			}

			// First player gave 1 correct answer
			await gameUtils.giveCorrectAnswer(app, userFirstAccessToken)

			// Second player gave 1 correct answer
			await gameUtils.giveCorrectAnswer(app, userSecondAccessToken)

			// Get the game
			const getGameRes = await gameUtils.giveWrongAnswer(app, userSecondAccessToken)

			// Check user 1 has score 2 and user 2 has score 5
			const updatedGame = getGameRes.body
			expect(updatedGame.status).toBe(GameStatus.Finished)
			expect(updatedGame.firstPlayerProgress.score).toBe(2)
			expect(updatedGame.secondPlayerProgress.score).toBe(5)
			expect(typeof updatedGame.startGameDate).toBe('string')
			expect(typeof updatedGame.finishGameDate).toBe('string')

			// RUN A NEW GAME

			// Create a third user
			const [userThirdAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			// Get the game by first user
			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)

			// Get the game by second user
			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userThirdAccessToken)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('players does not finished game and another started a new one', async () => {
			const [userFirstAccessToken, userSecondAccessToken, game] =
				await gameUtils.createGameWithPlayers(app)

			// Give 4 answers by first and second user
			// First user give no right answers, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber - 2; i++) {
				await gameUtils.giveWrongAnswer(app, userFirstAccessToken)
				await gameUtils.giveCorrectAnswer(app, userSecondAccessToken)
			}

			// New players RUN A NEW GAME

			const [userThirdAccessToken, userFourthAccessToken] =
				await gameUtils.createGameWithPlayers(app)

			// Third and fourth players gave one answer each
			await gameUtils.giveWrongAnswer(app, userThirdAccessToken)
			await gameUtils.giveWrongAnswer(app, userFourthAccessToken)

			// First and second players gave one answer each
			await gameUtils.giveCorrectAnswer(app, userFirstAccessToken)
			await gameUtils.giveWrongAnswer(app, userSecondAccessToken)
		})

		it('players finished one game and another', async () => {
			const [userFirstAccessToken, userSecondAccessToken, game] =
				await gameUtils.createGameWithPlayers(app)

			// Give all answers by first and second user
			// First user give no right answers, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				await gameUtils.giveWrongAnswer(app, userFirstAccessToken)
				await gameUtils.giveCorrectAnswer(app, userSecondAccessToken)
			}

			// First user connects to the new game
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Second user connects to the game
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			// Give all answers by first and second user
			// First user give no right answers, but second user answered all questions right
			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				await gameUtils.giveWrongAnswer(app, userFirstAccessToken)
				await gameUtils.giveWrongAnswer(app, userSecondAccessToken)
			}
		})
	})
})
