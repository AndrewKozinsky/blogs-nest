import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { HTTP_STATUSES } from '../src/settings/config'
import RouteNames from '../src/settings/routeNames'
import { DBTypes } from '../src/db/dbTypes'
import {
	addBlogRequest,
	addPostCommentRequest,
	addPostRequest,
	addUserByAdminRequest,
	checkCommentObj,
	loginRequest,
	userEmail,
	userPassword,
} from './utils/utils'

import { describe } from 'node:test'
import { createTestApp } from './utils/common'
import { clearAllDB } from './utils/db'

it.skip('123', async () => {
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

	describe('Getting a comment', () => {
		it.only('should return 404 if a comment does not exists', async () => {
			const getCommentRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.COMMENTS.COMMENT_ID('999').full,
			)

			expect(getCommentRes.status).toBe(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return an existing comment', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			const createdCommentRes = await addPostCommentRequest(app, userToken, postId)
			const commentId = createdCommentRes.body.id

			const getCommentRes = await request(app.getHttpServer())
				.get('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).full)
				.set('authorization', 'Bearer ' + userToken)
				.expect(HTTP_STATUSES.OK_200)

			checkCommentObj(
				getCommentRes.body,
				createdUserRes.body.id,
				createdUserRes.body.login,
				0,
				0,
				DBTypes.LikeStatuses.None,
			)
		})
	})

	describe('Updating a comment', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.COMMENTS.COMMENT_ID('999').full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not update a non existing comment', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			await request(app.getHttpServer())
				.post('/' + RouteNames.COMMENTS.COMMENT_ID('999').full)
				.set('authorization', 'Bearer ' + userToken)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should not update a comment if the user is not owner', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// User one will create a comment
			const createdUserOneRes = await addUserByAdminRequest(app)
			expect(createdUserOneRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserOneRes = await loginRequest(app, userEmail, userPassword)
			const userOneToken = loginUserOneRes.body.accessToken

			// User two will try to update the comment
			const createdUserTwoRes = await addUserByAdminRequest(app, {
				login: 'login-2',
				password: 'password-2',
				email: 'email-2@mail.com',
			})
			expect(createdUserTwoRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserTwoRes = await loginRequest(app, 'email-2@mail.com', 'password-2')
			const userTwoToken = loginUserTwoRes.body.accessToken

			// User one will create a comment
			const createdCommentRes = await addPostCommentRequest(app, userOneToken, postId)
			const commentId = createdCommentRes.body.id

			// User two will try to update the comment
			const updateCommentRes = await request(app.getHttpServer())
				.put('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).full)
				.send(JSON.stringify({ content: 'new content min 20 characters' }))
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.set('authorization', 'Bearer ' + userTwoToken)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('should not update a comment by wrong dto', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// User will create a comment
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			// User one will create a comment
			const createdCommentRes = await addPostCommentRequest(app, userToken, postId)
			const commentId = createdCommentRes.body.id

			const updateCommentRes = await request(app.getHttpServer())
				.put('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).full)
				.send(JSON.stringify({ content: 'WRONG' }))
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.set('authorization', 'Bearer ' + userToken)
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should update a comment by correct dto', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// User will create a comment
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			// User one will create a comment
			const createdCommentRes = await addPostCommentRequest(app, userToken, postId)
			const commentId = createdCommentRes.body.id

			const updateCommentRes = await request(app.getHttpServer())
				.put('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).full)
				.send(JSON.stringify({ content: 'right content right content' }))
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.set('authorization', 'Bearer ' + userToken)
				.expect(HTTP_STATUSES.NO_CONTENT_204)
		})
	})

	describe('Deleting a comment', () => {
		it('should forbid a request from an unauthorized user', async () => {
			return request(app.getHttpServer()).put('/' + RouteNames.COMMENTS.COMMENT_ID('').full)
		})

		it('should not delete a non existing comment', async () => {
			// User will create a comment
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			await request(app.getHttpServer())
				.delete('/' + RouteNames.COMMENTS.COMMENT_ID('notExist').full)
				.set('authorization', 'Bearer ' + userToken)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should not delete a comment if the user is not owner', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// User one will create a comment
			const createdUserOneRes = await addUserByAdminRequest(app)
			expect(createdUserOneRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserOneRes = await loginRequest(app, userEmail, userPassword)
			const userOneToken = loginUserOneRes.body.accessToken

			// User two will try to delete the comment
			const createdUserTwoRes = await addUserByAdminRequest(app, {
				login: 'login-2',
				password: 'password-2',
				email: 'email-2@mail.com',
			})
			expect(createdUserTwoRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserTwoRes = await loginRequest(app, 'email-2@mail.com', 'password-2')
			const userTwoToken = loginUserTwoRes.body.accessToken

			// User one will delete a comment
			const createdCommentRes = await addPostCommentRequest(app, userOneToken, postId)
			const commentId = createdCommentRes.body.id

			// User two will try to delete the comment
			await request(app.getHttpServer())
				.delete('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).full)
				.set('authorization', 'Bearer ' + userTwoToken)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('should delete an existing comment', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// User will create a comment
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			// User one will create a comment
			const createdCommentRes = await addPostCommentRequest(app, userToken, postId)
			const commentId = createdCommentRes.body.id

			await request(app.getHttpServer())
				.delete('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).full)
				.set('authorization', 'Bearer ' + userToken)
				.expect(HTTP_STATUSES.NO_CONTENT_204)
		})
	})

	describe('Make a comment like status', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.COMMENTS.COMMENT_ID('999').LIKE_STATUS.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 404 if a comment does not exists', async () => {
			// User will create a comment
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			await request(app.getHttpServer())
				.put('/' + RouteNames.COMMENTS.COMMENT_ID('999').LIKE_STATUS.full)
				.set('authorization', 'Bearer ' + userToken)
				.send(JSON.stringify({ likeStatus: 'None' }))
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return 400 if requst body does not exist', async () => {
			// User will create a comment
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			await request(app.getHttpServer())
				.put('/' + RouteNames.COMMENTS.COMMENT_ID('999').LIKE_STATUS.full)
				.set('authorization', 'Bearer ' + userToken)
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should return 204 if pass right body data to right address', async () => {
			// Create a blog
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			// Create a post in the blog
			const createdPostRes = await addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// Create a user on behalf of which requests will be made
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await loginRequest(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			// Create a comment
			const createdCommentRes = await addPostCommentRequest(app, userToken, postId)
			const commentId = createdCommentRes.body.id

			// Set a like status to the comment
			await request(app.getHttpServer())
				.put('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).LIKE_STATUS.full)
				.set('authorization', 'Bearer ' + userToken)
				.send(JSON.stringify({ likeStatus: DBTypes.LikeStatuses.Like }))
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			// Get the comment again by an unauthorized user to check a returned object
			const getCommentRes = await request(app.getHttpServer())
				.get('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).full)
				.expect(HTTP_STATUSES.OK_200)

			checkCommentObj(
				getCommentRes.body,
				createdUserRes.body.id,
				createdUserRes.body.login,
				1,
				0,
				DBTypes.LikeStatuses.None,
			)

			// Get the comment again by an authorized user to check a returned object
			const getComment2Res = await request(app.getHttpServer())
				.get('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).full)
				.set('authorization', 'Bearer ' + userToken)
				.expect(HTTP_STATUSES.OK_200)

			checkCommentObj(
				getComment2Res.body,
				createdUserRes.body.id,
				createdUserRes.body.login,
				1,
				0,
				DBTypes.LikeStatuses.Like,
			)
		})
	})
})
