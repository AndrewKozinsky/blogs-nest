import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { CreateQuestionDtoModel } from '../../src/models/saQuestions/questions.input.model'
import { GetQuestionsOutModel } from '../../src/models/saQuestions/questions.output.model'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { adminAuthorizationValue, createTestApp } from '../utils/common'
import { clearAllDB } from '../utils/db'
import { questionUtils } from '../utils/questionUtils'

it('123', async () => {
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

	describe('Getting all questions', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return an object with property items contains an empty array', async () => {
			const successAnswer: GetQuestionsOutModel = {
				pagesCount: 0,
				page: 1,
				pageSize: 10,
				totalCount: 0,
				items: [],
			}

			await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200, successAnswer)
		})

		it('should return an object with property items contains array with 2 items after creating 2 query questions', async () => {
			await questionUtils.addQuestionRequest(app)
			await questionUtils.addQuestionRequest(app)

			const getQuestionsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200)

			expect(getQuestionsRes.body.pagesCount).toBe(1)
			expect(getQuestionsRes.body.page).toBe(1)
			expect(getQuestionsRes.body.pageSize).toBe(10)
			expect(getQuestionsRes.body.totalCount).toBe(2)
			expect(getQuestionsRes.body.items.length).toBe(2)

			checkQuestionObj(getQuestionsRes.body.items[0])
			checkQuestionObj(getQuestionsRes.body.items[1])
		})

		it('should return an object with properties with specific values after creating 7 questions', async () => {
			await questionUtils.addQuestionRequest(app)
			await questionUtils.addQuestionRequest(app)
			await questionUtils.addQuestionRequest(app)
			await questionUtils.addQuestionRequest(app)
			await questionUtils.addQuestionRequest(app)
			await questionUtils.addQuestionRequest(app)
			await questionUtils.addQuestionRequest(app)

			const getQuestionsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value + '?pageNumber=2&pageSize=2')
				.set('authorization', adminAuthorizationValue)

			expect(getQuestionsRes.body.page).toBe(2)
			expect(getQuestionsRes.body.pagesCount).toBe(4)
			expect(getQuestionsRes.body.totalCount).toBe(7)
			expect(getQuestionsRes.body.items.length).toBe(2)
		})

		it('should return questions with body contains "this" after creating 7 questions', async () => {
			const test = await questionUtils.addQuestionRequest(app, { body: 'abcdefg__1 this' })
			await questionUtils.addQuestionRequest(app, { body: 'abcdefg__2' })
			await questionUtils.addQuestionRequest(app, { body: 'abcdefg__3 this' })
			await questionUtils.addQuestionRequest(app, { body: 'abcdefg__4' })
			await questionUtils.addQuestionRequest(app, { body: 'abcdefg__5 this' })
			await questionUtils.addQuestionRequest(app, { body: 'abcdefg__6 this' })
			await questionUtils.addQuestionRequest(app, { body: 'abcdefg__this' })

			const getQuestionsRes = await request(app.getHttpServer())
				.get(
					'/' +
						RouteNames.SA_QUESTIONS.value +
						'?pageNumber=2&pageSize=2&bodySearchTerm=this',
				)
				.set('authorization', adminAuthorizationValue)

			expect(getQuestionsRes.body.page).toBe(2)
			expect(getQuestionsRes.body.pagesCount).toBe(3)
			expect(getQuestionsRes.body.totalCount).toBe(5)
			expect(getQuestionsRes.body.items.length).toBe(2)
		})

		it('should return questions sorted by body and asc and desc order', async () => {
			await questionUtils.addQuestionRequest(app, { body: 'question___3' })
			await questionUtils.addQuestionRequest(app, { body: 'question___5' })
			await questionUtils.addQuestionRequest(app, { body: 'question___1' })
			await questionUtils.addQuestionRequest(app, { body: 'question___12' })
			await questionUtils.addQuestionRequest(app, { body: 'question___4' })

			// Get questions sorted by createdat field (by default)
			const questionsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value)
				.set('authorization', adminAuthorizationValue)

			const questions = questionsRes.body.items
			expect(questions[0].body).toBe('question___4')
			expect(questions[1].body).toBe('question___12')
			expect(questions[2].body).toBe('question___1')
			expect(questions[3].body).toBe('question___5')
			expect(questions[4].body).toBe('question___3')

			// Get questions sorted by name field with asc order
			const getQuestionsAscRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value + '?sortDirection=asc&sortBy=body')
				.set('authorization', adminAuthorizationValue)

			const questionsAsc = getQuestionsAscRes.body.items
			expect(questionsAsc[0].body).toBe('question___1')
			expect(questionsAsc[1].body).toBe('question___12')
			expect(questionsAsc[2].body).toBe('question___3')
			expect(questionsAsc[3].body).toBe('question___4')
			expect(questionsAsc[4].body).toBe('question___5')

			// Get questions sorted by name field with desc order
			const getQuestionsDescRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value + '?sortDirection=desc&sortBy=body')
				.set('authorization', adminAuthorizationValue)

			const questionsDesc = getQuestionsDescRes.body.items
			expect(questionsDesc[0].body).toBe('question___5')
			expect(questionsDesc[1].body).toBe('question___4')
			expect(questionsDesc[2].body).toBe('question___3')
			expect(questionsDesc[3].body).toBe('question___12')
			expect(questionsDesc[4].body).toBe('question___1')
		})
	})

	describe('Creating a question', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.SA_QUESTIONS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not create a question by wrong dto', async () => {
			const createdQuestionRes = await questionUtils.addQuestionRequest(app, {
				body: 'so',
			})

			expect(createdQuestionRes.status).toBe(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(createdQuestionRes.body.errorsMessages)).toBe('[object Array]')
			expect(createdQuestionRes.body.errorsMessages.length).toBe(1)
			expect(createdQuestionRes.body.errorsMessages[0].field).toBe('body')
		})

		it('should create a question by correct dto', async () => {
			const createdQuestionRes = await questionUtils.addQuestionRequest(app)
			expect(createdQuestionRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const question = createdQuestionRes.body
			checkQuestionObj(createdQuestionRes.body)
			expect(question.updatedAt).toBe(null)

			// Check if there are 2 questions after adding another one
			const createdSecondQuestionRes = await questionUtils.addQuestionRequest(app)
			expect(createdSecondQuestionRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const allQuestionsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200)

			expect(allQuestionsRes.body.items.length).toBe(2)
		})
	})

	describe('Updating a question', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID('999').full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not update a non existing question', async () => {
			const updateQuizQuestionDto: CreateQuestionDtoModel = {
				body: 'my UPDATED question',
				correctAnswers: ['my correct answer'],
			}

			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID('999').full)
				.send(updateQuizQuestionDto)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should not update a question by wrong dto', async () => {
			const createdQuizQuestionRes = await questionUtils.addQuestionRequest(app)
			const createdQuizQuestionId = createdQuizQuestionRes.body.id

			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).full)
				.send({})
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.BAD_REQUEST_400)

			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).full)
				.send({ published: 'true' })
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it.only('should update a quiz question by correct dto', async () => {
			const createdQuizQuestionRes = await questionUtils.addQuestionRequest(app)
			expect(createdQuizQuestionRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdQuizQuestionId = createdQuizQuestionRes.body.id

			const updateQuizQuestionDto: CreateQuestionDtoModel = {
				body: 'my UPDATED body',
				correctAnswers: ['my UPDATED answers'],
			}

			const updateQuestionRes = await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).full)
				.send(updateQuizQuestionDto)
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			const getQuestionRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).full)
				.set('authorization', adminAuthorizationValue)

			expect(getQuestionRes.status).toBe(HTTP_STATUSES.OK_200)
			expect(getQuestionRes.body.body).toBe(updateQuizQuestionDto.body)
			expect(getQuestionRes.body.correctAnswers).toEqual(updateQuizQuestionDto.correctAnswers)
			expect(getQuestionRes.body.updatedAt).not.toBeNull()
		})
	})

	describe('Publish/unpublish a question', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID('999').PUBLISH.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not set a publish/unpublish status for non existing quiz question', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID('999').PUBLISH.full)
				.set('authorization', adminAuthorizationValue)
				.send({ published: true })
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return 400 if to pass request body', async () => {
			const createdQuestionRes = await questionUtils.addQuestionRequest(app)
			expect(createdQuestionRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const questionId = createdQuestionRes.body.id

			const updateQuestionRes = await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(questionId).PUBLISH.full)
				.set('authorization', adminAuthorizationValue)
				.send({ published: 'true' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(updateQuestionRes.body.errorsMessages)).toBe('[object Array]')
		})

		it('should set publish/unpublish status for a question', async () => {
			const createdQuizQuestionRes = await questionUtils.addQuestionRequest(app)
			expect(createdQuizQuestionRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdQuizQuestionId = createdQuizQuestionRes.body.id

			// Make quiz question published
			const updateQuestionRes = await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).PUBLISH.full)
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.send({ published: true })
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			expect(updateQuestionRes.body).not.toBeNull()

			const getQuestionRes_1 = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).full)
				.set('authorization', adminAuthorizationValue)

			expect(getQuestionRes_1.status).toBe(HTTP_STATUSES.OK_200)
			expect(getQuestionRes_1.body.published).toBe(true)

			// Make quiz question unpublished
			const updateQuestionRes_2 = await request(app.getHttpServer())
				.put('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).PUBLISH.full)
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.send({ published: false })
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			expect(updateQuestionRes_2.body).not.toBeNull()

			const getQuestionRes_2 = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).full)
				.set('authorization', adminAuthorizationValue)

			expect(getQuestionRes_2.body.published).toBe(false)
		})
	})

	describe('Deleting a question', () => {
		it('should forbid a request from an unauthorized user', async () => {
			request(app.getHttpServer())
				.delete('/' + RouteNames.SA_QUESTIONS.value)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('should not delete a non existing question', async () => {
			await request(app.getHttpServer())
				.delete('/' + RouteNames.SA_QUESTIONS.QUESTION_ID('999').full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should delete a question', async () => {
			const createdQuizQuestionRes = await questionUtils.addQuestionRequest(app)
			expect(createdQuizQuestionRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdQuizQuestionId = createdQuizQuestionRes.body.id

			await request(app.getHttpServer())
				.delete('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.QUESTION_ID(createdQuizQuestionId).full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})
	})
})

function checkQuestionObj(quizQuestionObj: any) {
	expect(typeof quizQuestionObj.id).toBe('string')
	expect(typeof quizQuestionObj.body).toBe('string')
	expect({}.toString.call(quizQuestionObj.correctAnswers)).toBe('[object Array]')
	expect(typeof quizQuestionObj.published).toBe('boolean')
	expect(quizQuestionObj.createdAt).toMatch(
		/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
	)

	if (quizQuestionObj.updatedAt) {
		expect(quizQuestionObj.updatedAt).toMatch(
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
		)
	} else {
		expect(quizQuestionObj.updatedAt).toBe(null)
	}
}
