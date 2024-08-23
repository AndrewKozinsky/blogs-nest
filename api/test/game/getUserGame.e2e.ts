import { INestApplication } from '@nestjs/common'
import { GameStatus } from '../../src/db/pg/entities/game/game'
import { gameConfig } from '../../src/features/pairGame/config'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { createTestApp } from '../utils/common'
import { clearAllDB } from '../utils/db'
import { checkGameUtils, gameUtils } from '../utils/gameUtils'
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

	describe('Get user game', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 404 if current user is not a player', async () => {
			const [userAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('only one player has joined to the game', async () => {
			const [userAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const getGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const game = getGameRes.body
			checkGameUtils.checkGameObj(game)

			expect(game.firstPlayerProgress.answers.length).toBe(0)
			expect(game.firstPlayerProgress.score).toBe(0)
			expect(game.secondPlayerProgress).toBe(null)
			expect(game.questions).toBe(null)
			expect(game.status).toBe(GameStatus.Pending)
			expect(game.startGameDate).toBe(null)
			expect(game.finishGameDate).toBe(null)
		})

		it('two players have joined to the game', async () => {
			const [userFirstAccessToken, userSecondAccessToken] =
				await gameUtils.createGameWithQuestionsAndPlayers(app)

			const getGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const game = getGameRes.body
			checkGameUtils.checkGameObj(game)
			expect(game.secondPlayerProgress).not.toBe(null)
			expect(game.status).toBe(GameStatus.Active)
			expect(game.questions.length).toBe(5)
		})

		it('should return 404 if players have finished game', async () => {
			const [userFirstAccessToken, userSecondAccessToken] =
				await gameUtils.createGameWithQuestionsAndPlayers(app)

			for (let i = 0; i < 2; i++) {
				await gameUtils.giveWrongAnswer(app, userFirstAccessToken)
				await gameUtils.giveWrongAnswer(app, userSecondAccessToken)
			}

			const getGameByFirstPlayer = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.OK_200)
		})

		it('should return 404 if players have finished game', async () => {
			const [userFirstAccessToken, userSecondAccessToken] =
				await gameUtils.createGameWithQuestionsAndPlayers(app)

			for (let i = 0; i < gameConfig.questionsNumber; i++) {
				await gameUtils.giveWrongAnswer(app, userFirstAccessToken)
				await gameUtils.giveWrongAnswer(app, userSecondAccessToken)
			}

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)

			await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.full)
				.set('authorization', 'Bearer ' + userSecondAccessToken)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)

			// First user connects to the new game
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)
		})
	})
})
