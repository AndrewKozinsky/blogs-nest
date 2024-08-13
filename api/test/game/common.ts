import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { userUtils } from '../utils/userUtils'
import { addQuestionRequest } from '../utils/utils'

export function checkGameObj(gameObj: any) {
	expect(typeof gameObj.id).toBe('string')

	checkPlayerObj(gameObj.firstPlayerProgress)
	if (gameObj.secondPlayerProgress) {
		checkPlayerObj(gameObj.secondPlayerProgress)
	}

	checkQuestionsObj(gameObj.questions)

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
}

export async function createGameQuestions(app: INestApplication, questionsNumber = 10) {
	for (let i = 0; i < questionsNumber; i++) {
		const counter = i + 1

		await addQuestionRequest(app, {
			body: 'My question ' + counter,
			correctAnswers: ['Answer 1', 'Answer 2'],
		})
	}
}

export async function createGameWithPlayers(app: INestApplication) {
	await createGameQuestions(app, 10)

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
}
