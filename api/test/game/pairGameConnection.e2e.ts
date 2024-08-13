import { INestApplication } from '@nestjs/common'
import { GameStatus } from '../../src/db/pg/entities/game/game'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { createTestApp } from '../utils/common'
import { clearAllDB } from '../utils/db'
import { checkGameUtils, gameUtils } from '../utils/gameUtils'
import { questionUtils } from '../utils/questionUtils'
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

	describe('Connection to a game', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 403 if current user is already participating in active pair', async () => {
			const [userAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('should return an object without questions if a single user connected to the empty game', async () => {
			await questionUtils.createGameQuestions(app, 10)

			const [userAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			const connectToGameRes = await request(app.getHttpServer())
				.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const game = connectToGameRes.body
			checkGameUtils.checkGameObj(connectToGameRes.body)

			expect(game.firstPlayerProgress.answers.length).toBe(0)
			expect(game.firstPlayerProgress.score).toBe(0)
			expect(game.secondPlayerProgress).toBe(null)
			expect(game.questions).toBe(null)
			expect(game.status).toBe(GameStatus.Pending)
			expect(game.startGameDate).toBe(null)
			expect(game.finishGameDate).toBe(null)
		})

		it('should return an object if the second user connected to the game', async () => {
			const [userFirstAccessToken, userSecondAccessToken, game] =
				await gameUtils.createGameWithPlayers(app)

			const updatedGameRes = await request(app.getHttpServer())
				.get('/' + RouteNames.PAIR_GAME.PAIRS.GAME_ID(game.id).full)
				.set('authorization', 'Bearer ' + userFirstAccessToken)
				.expect(HTTP_STATUSES.OK_200)

			const updatedGame = updatedGameRes.body

			checkGameUtils.checkGameObj(updatedGame)
			expect(updatedGame.secondPlayerProgress).not.toBe(null)
			expect(updatedGame.status).toBe(GameStatus.Active)
			expect(updatedGame.questions.length).toBe(5)
		})
	})
})
