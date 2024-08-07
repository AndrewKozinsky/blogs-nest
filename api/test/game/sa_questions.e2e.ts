import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { describe } from 'node:test'
import { CreateQuestionDtoModel } from '../../src/features/saQuestions/models/quizQuestions.input.model'
import { GetQuizQuestionsOutModel } from '../../src/features/saQuestions/models/quizQuestions.output.model'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { createTestApp } from '../utils/common'
import { clearAllDB } from '../utils/db'
import { addQuestionRequest, adminAuthorizationValue } from '../utils/utils'

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
			const successAnswer: GetQuizQuestionsOutModel = {
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
			await addQuestionRequest(app)
			await addQuestionRequest(app)

			const getQuizQuestionsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200)

			expect(getQuizQuestionsRes.body.pagesCount).toBe(1)
			expect(getQuizQuestionsRes.body.page).toBe(1)
			expect(getQuizQuestionsRes.body.pageSize).toBe(10)
			expect(getQuizQuestionsRes.body.totalCount).toBe(2)
			expect(getQuizQuestionsRes.body.items.length).toBe(2)

			checkQuizQuestionObj(getQuizQuestionsRes.body.items[0])
			checkQuizQuestionObj(getQuizQuestionsRes.body.items[1])
		})

		it('should return an object with properties with specific values after creating 7 questions', async () => {
			await addQuestionRequest(app)
			await addQuestionRequest(app)
			await addQuestionRequest(app)
			await addQuestionRequest(app)
			await addQuestionRequest(app)
			await addQuestionRequest(app)
			await addQuestionRequest(app)

			const getQuizQuestionsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value + '?pageNumber=2&pageSize=2')
				.set('authorization', adminAuthorizationValue)

			expect(getQuizQuestionsRes.body.page).toBe(2)
			expect(getQuizQuestionsRes.body.pagesCount).toBe(4)
			expect(getQuizQuestionsRes.body.totalCount).toBe(7)
			expect(getQuizQuestionsRes.body.items.length).toBe(2)
		})

		it('should return questions with body contains "this" after creating 7 quiz questions', async () => {
			const test = await addQuestionRequest(app, { body: 'abcdefg__1 this' })
			await addQuestionRequest(app, { body: 'abcdefg__2' })
			await addQuestionRequest(app, { body: 'abcdefg__3 this' })
			await addQuestionRequest(app, { body: 'abcdefg__4' })
			await addQuestionRequest(app, { body: 'abcdefg__5 this' })
			await addQuestionRequest(app, { body: 'abcdefg__6 this' })
			await addQuestionRequest(app, { body: 'abcdefg__this' })

			const getQuizQuestionsRes = await request(app.getHttpServer())
				.get(
					'/' +
						RouteNames.SA_QUESTIONS.value +
						'?pageNumber=2&pageSize=2&bodySearchTerm=this',
				)
				.set('authorization', adminAuthorizationValue)

			expect(getQuizQuestionsRes.body.page).toBe(2)
			expect(getQuizQuestionsRes.body.pagesCount).toBe(3)
			expect(getQuizQuestionsRes.body.totalCount).toBe(5)
			expect(getQuizQuestionsRes.body.items.length).toBe(2)
		})

		it('should return quiz questions sorted by body and asc and desc order', async () => {
			await addQuestionRequest(app, { body: 'question___3' })
			await addQuestionRequest(app, { body: 'question___5' })
			await addQuestionRequest(app, { body: 'question___1' })
			await addQuestionRequest(app, { body: 'question___12' })
			await addQuestionRequest(app, { body: 'question___4' })

			// Get quiz questions sorted by createdat field (by default)
			const getQuizQuestionsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value)
				.set('authorization', adminAuthorizationValue)

			const quizQuestions = getQuizQuestionsRes.body.items
			expect(quizQuestions[0].body).toBe('question___4')
			expect(quizQuestions[1].body).toBe('question___12')
			expect(quizQuestions[2].body).toBe('question___1')
			expect(quizQuestions[3].body).toBe('question___5')
			expect(quizQuestions[4].body).toBe('question___3')

			// Get quiz questions sorted by name field with asc order
			const getQuizQuestionsAscRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value + '?sortDirection=asc&sortBy=body')
				.set('authorization', adminAuthorizationValue)

			const QuizQuestionsAsc = getQuizQuestionsAscRes.body.items
			expect(QuizQuestionsAsc[0].body).toBe('question___1')
			expect(QuizQuestionsAsc[1].body).toBe('question___12')
			expect(QuizQuestionsAsc[2].body).toBe('question___3')
			expect(QuizQuestionsAsc[3].body).toBe('question___4')
			expect(QuizQuestionsAsc[4].body).toBe('question___5')

			// Get quiz questions sorted by name field with desc order
			const getQuizQuestionsDescRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_QUESTIONS.value + '?sortDirection=desc&sortBy=body')
				.set('authorization', adminAuthorizationValue)

			const quizQuestionsDesc = getQuizQuestionsDescRes.body.items
			expect(quizQuestionsDesc[0].body).toBe('question___5')
			expect(quizQuestionsDesc[1].body).toBe('question___4')
			expect(quizQuestionsDesc[2].body).toBe('question___3')
			expect(quizQuestionsDesc[3].body).toBe('question___12')
			expect(quizQuestionsDesc[4].body).toBe('question___1')
		})
	})

	describe('Creating a question', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.SA_QUESTIONS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not create a quiz question by wrong dto', async () => {
			const createdQuizQuestionRes = await addQuestionRequest(app, {
				body: 'so',
			})

			expect(createdQuizQuestionRes.status).toBe(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(createdQuizQuestionRes.body.errorsMessages)).toBe(
				'[object Array]',
			)
			expect(createdQuizQuestionRes.body.errorsMessages.length).toBe(1)
			expect(createdQuizQuestionRes.body.errorsMessages[0].field).toBe('body')
		})

		it('should create a quiz question by correct dto', async () => {
			const createdQuizQuestionRes = await addQuestionRequest(app)
			expect(createdQuizQuestionRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const question = createdQuizQuestionRes.body
			checkQuizQuestionObj(createdQuizQuestionRes.body)
			expect(question.updatedAt).toBe(null)

			// Check if there are 2 quiz questions after adding another one
			const createdSecondQuizQuestionRes = await addQuestionRequest(app)
			expect(createdSecondQuizQuestionRes.status).toBe(HTTP_STATUSES.CREATED_201)

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
			const createdQuizQuestionRes = await addQuestionRequest(app)
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
			const createdQuizQuestionRes = await addQuestionRequest(app)
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
			const createdQuestionRes = await addQuestionRequest(app)
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
			const createdQuizQuestionRes = await addQuestionRequest(app)
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
			const createdQuizQuestionRes = await addQuestionRequest(app)
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

function checkQuizQuestionObj(quizQuestionObj: any) {
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
