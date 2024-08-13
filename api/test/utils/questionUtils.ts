import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { CreateQuestionDtoModel } from '../../src/features/saQuestions/models/questions.input.model'
import RouteNames from '../../src/settings/routeNames'
import { adminAuthorizationValue } from './common'

export const questionUtils = {
	createDtoSAQuestion(
		newQuizQuestionObj: Partial<CreateQuestionDtoModel> = {},
	): CreateQuestionDtoModel {
		return Object.assign(
			{
				body: 'My difficult question.',
				correctAnswers: ['answer1', 'answer2'],
			},
			{ ...newQuizQuestionObj },
		)
	},
	async addQuestionRequest(
		app: INestApplication,
		quizQuestionDto: Partial<CreateQuestionDtoModel> = {},
	) {
		return request(app.getHttpServer())
			.post('/' + RouteNames.SA_QUESTIONS.value)
			.send(this.createDtoSAQuestion(quizQuestionDto))
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.set('authorization', adminAuthorizationValue)
	},
	async createGameQuestions(app: INestApplication, questionsNumber = 10) {
		for (let i = 0; i < questionsNumber; i++) {
			const counter = i + 1

			await this.addQuestionRequest(app, {
				body: 'My question ' + counter,
				correctAnswers: ['Answer 1', 'Answer 2'],
			})
		}
	},
}
