import { INestApplication } from '@nestjs/common'
import { addQuizQuestionRequest } from '../utils/utils'

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

		expect(typeof questionObj.id).toBe('string')
		expect(typeof questionObj.body).toBe('string')
	}
}

export async function createGameQuestions(app: INestApplication, questionsNumber = 10) {
	for (let i = 0; i < questionsNumber; i++) {
		const counter = i + 1

		await addQuizQuestionRequest(app, {
			body: 'My question ' + counter,
			correctAnswers: ['Answer 1', 'Answer 2'],
		})
	}
}
