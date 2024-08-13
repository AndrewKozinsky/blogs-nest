import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { gameConfig } from '../../src/features/pairGame/config'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { questionUtils } from './questionUtils'
import { userUtils } from './userUtils'

export const gameUtils = {
	async createGameWithPlayers(app: INestApplication) {
		await questionUtils.createGameQuestions(app, 10)

		const [userFirstAccessToken] = await userUtils.createUniqueUserAndLogin(app)
		const [userSecondAccessToken] = await userUtils.createUniqueUserAndLogin(app)

		// First user connects to the game
		const firstConnectToGameRes = await request(app.getHttpServer())
			.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
			.set('authorization', 'Bearer ' + userFirstAccessToken)
			.expect(HTTP_STATUSES.OK_200)

		// Second user connects to the game
		const secondConnectToGameRes = await request(app.getHttpServer())
			.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
			.set('authorization', 'Bearer ' + userSecondAccessToken)
			.expect(HTTP_STATUSES.OK_200)

		return [userFirstAccessToken, userSecondAccessToken, firstConnectToGameRes.body]
	},
	async giveCorrectAnswer(app: INestApplication, userAccessToken: string) {
		return await request(app.getHttpServer())
			.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
			.send({ answer: 'Answer 1' })
			.set('authorization', 'Bearer ' + userAccessToken)
			.expect(HTTP_STATUSES.OK_200)
	},
	async giveWrongAnswer(app: INestApplication, userAccessToken: string) {
		return await request(app.getHttpServer())
			.post('/' + RouteNames.PAIR_GAME.PAIRS.MY_CURRENT.ANSWERS.full)
			.send({ answer: 'My wrong answer' })
			.set('authorization', 'Bearer ' + userAccessToken)
			.expect(HTTP_STATUSES.OK_200)
	},
	async usersConnectToGame(
		app: INestApplication,
		firstUserAccessToken: string,
		secondUserAccessToken: string,
	) {
		// First user connects to the game
		const firstConnectToGameRes = await request(app.getHttpServer())
			.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
			.set('authorization', 'Bearer ' + firstUserAccessToken)
			.expect(HTTP_STATUSES.OK_200)

		// Second user connects to the game
		const secondConnectToGameRes = await request(app.getHttpServer())
			.post('/' + RouteNames.PAIR_GAME.PAIRS.CONNECTION.full)
			.set('authorization', 'Bearer ' + secondUserAccessToken)
			.expect(HTTP_STATUSES.OK_200)
	},
	async createGameAndFinish(
		app: INestApplication,
		firstUserAccessToken: string,
		secondUserAccessToken: string,
	) {
		await questionUtils.createGameQuestions(app, 10)

		await this.usersConnectToGame(app, firstUserAccessToken, secondUserAccessToken)

		for (let i = 0; i < gameConfig.questionsNumber; i++) {
			await this.giveCorrectAnswer(app, firstUserAccessToken)
			await this.giveCorrectAnswer(app, secondUserAccessToken)
		}
	},
	async createGameAndEveryPlayerFinishGiveWithTwoCorrectAnswers(
		app: INestApplication,
		firstUserAccessToken: string,
		secondUserAccessToken: string,
	) {
		await questionUtils.createGameQuestions(app, 10)

		await this.usersConnectToGame(app, firstUserAccessToken, secondUserAccessToken)

		for (let i = 0; i < 2; i++) {
			await this.giveCorrectAnswer(app, firstUserAccessToken)
			await this.giveCorrectAnswer(app, secondUserAccessToken)
		}

		for (let i = 0; i < gameConfig.questionsNumber - 2; i++) {
			await this.giveWrongAnswer(app, firstUserAccessToken)
			await this.giveWrongAnswer(app, secondUserAccessToken)
		}
	},
	async createGameAndGiveTwoAnswers(
		app: INestApplication,
		firstUserAccessToken: string,
		secondUserAccessToken: string,
	) {
		await questionUtils.createGameQuestions(app, 10)

		await this.usersConnectToGame(app, firstUserAccessToken, secondUserAccessToken)

		for (let i = 0; i < 2; i++) {
			await this.giveCorrectAnswer(app, firstUserAccessToken)
			await this.giveCorrectAnswer(app, secondUserAccessToken)
		}
	},
}

export const checkGameUtils = {
	checkGameObj(gameObj: any) {
		expect(typeof gameObj.id).toBe('string')

		this.checkPlayerObj(gameObj.firstPlayerProgress)
		if (gameObj.secondPlayerProgress) {
			this.checkPlayerObj(gameObj.secondPlayerProgress)
		}

		this.checkQuestionsObj(gameObj.questions)

		expect(typeof gameObj.status).toBe('string')
		expect(typeof gameObj.pairCreatedDate).toBe('string')

		if (gameObj.startGameDate) {
			expect(gameObj.startGameDate).toMatch(
				/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
			)
		} else {
			expect(gameObj.startGameDate).toBe(null)
		}

		if (gameObj.finishGameDate) {
			expect(typeof gameObj.finishGameDate).toBe('string')
		} else {
			expect(gameObj.finishGameDate).toBe(null)
		}
	},
	checkPlayerObj(playerObj: any) {
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
	},
	checkQuestionsObj(questions: any) {
		if (questions) {
			expect({}.toString.call(questions)).toBe('[object Array]')

			if (questions.length) {
				const questionObj = questions[0]

				expect(typeof questionObj.id).toBe('string')
				expect(typeof questionObj.body).toBe('string')
			}
		} else {
			expect(questions).toBe(null)
		}
	},
}
