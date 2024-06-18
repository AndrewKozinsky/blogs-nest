import { INestApplication } from '@nestjs/common'
import { HTTP_STATUSES } from '../src/settings/config'
import RouteNames from '../src/settings/routeNames'
import { agent as request } from 'supertest'
import { GetUsersOutModel } from '../src/features/users/models/users.output.model'
import { createTestApp } from './utils/common'
import { clearAllDB } from './utils/db'
import { addUserByAdminRequest, adminAuthorizationValue, checkUserObj } from './utils/utils'

it('123', () => {
	expect(2).toBe(2)
})

describe('ROOT', () => {
	let app: INestApplication

	beforeEach(async () => {
		app = await createTestApp()
	})

	beforeEach(async () => {
		await clearAllDB(app)
	})

	describe('Getting all users', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return an object with property items contains an empty array', async () => {
			const successAnswer: GetUsersOutModel = {
				pagesCount: 0,
				page: 1,
				pageSize: 10,
				totalCount: 0,
				items: [],
			}

			await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200, successAnswer)
		})

		it('should return an object with property items contains array with 2 items after creating 2 users', async () => {
			await addUserByAdminRequest(app)
			await addUserByAdminRequest(app, {
				login: 'my-login-2',
				email: 'mail-2@email.com',
				password: 'password-2',
			})

			const getUsersRes = await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200)

			expect(getUsersRes.body.pagesCount).toBe(1)
			expect(getUsersRes.body.page).toBe(1)
			expect(getUsersRes.body.pageSize).toBe(10)
			expect(getUsersRes.body.totalCount).toBe(2)
			expect(getUsersRes.body.items.length).toBe(2)

			checkUserObj(getUsersRes.body.items[0])
			checkUserObj(getUsersRes.body.items[1])
		})

		it('should return an array of objects matching the queries scheme', async () => {
			await addUserByAdminRequest(app)
			await addUserByAdminRequest(app, {
				login: 'my-login-2',
				email: 'mail-2@email.com',
				password: 'password-2',
			})
			await addUserByAdminRequest(app, {
				login: 'my-login3',
				email: 'mail-3@email.com',
				password: 'password-4',
			})
			await addUserByAdminRequest(app, {
				login: 'my-login-4',
				email: 'mail-4@email.com',
				password: 'password-4',
			})
			await addUserByAdminRequest(app, {
				login: 'my-login-5',
				email: 'mail-5@email.com',
				password: 'password-5',
			})
			await addUserByAdminRequest(app, {
				login: 'my-login-6',
				email: 'mail-6@email.com',
				password: 'password-6',
			})
			await addUserByAdminRequest(app, {
				login: 'my-login-7',
				email: 'mail-7@email.com',
				password: 'password-7',
			})

			const getUsersRes = await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value + '?pageNumber=2&pageSize=2')
				.set('authorization', adminAuthorizationValue)

			expect(getUsersRes.body.page).toBe(2)
			expect(getUsersRes.body.pagesCount).toBe(4)
			expect(getUsersRes.body.totalCount).toBe(7)
			expect(getUsersRes.body.items.length).toBe(2)
		})

		it('should return filtered an array of objects', async () => {
			await addUserByAdminRequest(app, { login: 'in-one-1', email: 'email-1@email.com' }) //
			await addUserByAdminRequest(app, { login: 'in-two-1', email: 'email-2@email.com' }) //
			await addUserByAdminRequest(app, { login: 'in-one-1', email: 'email-3@email.com' }) //
			await addUserByAdminRequest(app, { login: 'in-two-1', email: 'email-4@email.com' }) //
			await addUserByAdminRequest(app, { login: 'in-one-1', email: 'email-5@email.jp' }) //
			await addUserByAdminRequest(app, { login: 'in-three-1', email: 'email-6@email.us' })
			await addUserByAdminRequest(app, { login: 'in-one-1', email: 'email-7@email.ru' }) //
			await addUserByAdminRequest(app, { login: 'in-one-2', email: 'email-8@email.com' }) //
			await addUserByAdminRequest(app, { login: 'in-one-3', email: 'email-9@email.com' }) //
			await addUserByAdminRequest(app, { login: 'in-one-4', email: 'email-10@email.com' }) //

			const getUsersRes = await request(app.getHttpServer())
				.get(
					'/' +
						RouteNames.USERS.value +
						'?pageNumber=2&pageSize=2&searchLoginTerm=one&searchEmailTerm=.com',
				)
				.set('authorization', adminAuthorizationValue)

			expect(getUsersRes.body.page).toBe(2)
			expect(getUsersRes.body.pagesCount).toBe(3)
			expect(getUsersRes.body.totalCount).toBe(5)
			expect(getUsersRes.body.items.length).toBe(2)

			const getUsers2Res = await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value + '?pageNumber=2&pageSize=2')
				.set('authorization', adminAuthorizationValue)
			expect(getUsers2Res.body.items[0].email).toBe('email-8@email.com')
			expect(getUsers2Res.body.items[1].email).toBe('email-7@email.ru')
		})

		it('should return filtered an array of objects sorted by login', async () => {
			await addUserByAdminRequest(app, { login: 'login_1', email: 'email-1@email.com' })
			await addUserByAdminRequest(app, { login: 'Login_2', email: 'email-2@email.com' })
			await addUserByAdminRequest(app, { login: 'login_3', email: 'email-3@email.com' })

			const getUsersRes = await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value + '?sortDirection=asc&sortBy=login')
				.set('authorization', adminAuthorizationValue)

			expect(getUsersRes.body.items[0].login).toBe('login_1')
			expect(getUsersRes.body.items[1].login).toBe('Login_2')
			expect(getUsersRes.body.items[2].login).toBe('login_3')

			const getUsersRes2 = await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value + '?sortDirection=desc&sortBy=login')
				.set('authorization', adminAuthorizationValue)

			expect(getUsersRes2.body.items[0].login).toBe('login_3')
			expect(getUsersRes2.body.items[1].login).toBe('Login_2')
			expect(getUsersRes2.body.items[2].login).toBe('login_1')
		})
	})

	describe('Creating an user', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.USERS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not create an user by wrong dto', async () => {
			const createdUserRes = await addUserByAdminRequest(app, { login: 'lo' })
			expect(createdUserRes.status).toBe(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(createdUserRes.body.errorsMessages)).toBe('[object Array]')
			expect(createdUserRes.body.errorsMessages.length).toBe(1)
			expect(createdUserRes.body.errorsMessages[0].field).toBe('login')
		})

		it('should create an user by correct dto', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			checkUserObj(createdUserRes.body)

			// Check if there are 2 users after adding another one
			const createdUser2Res = await addUserByAdminRequest(app, {
				login: 'my-login-2',
				email: 'mail-2@email.com',
				password: 'password-2',
			})
			expect(createdUser2Res.status).toBe(HTTP_STATUSES.CREATED_201)

			const allUsersRes = await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value)
				.set('authorization', adminAuthorizationValue)
			expect(allUsersRes.body.items.length).toBe(2)
		})
	})

	describe('Deleting an user', () => {
		it('should forbid a request from an unauthorized user', async () => {
			return request(app.getHttpServer()).put('/' + RouteNames.USERS.value)
		})

		it('should not delete a non existing user', async () => {
			await request(app.getHttpServer())
				.delete('/' + RouteNames.USERS.USER_ID('999').full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it.only('should delete an user', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdUserId = createdUserRes.body.id

			await request(app.getHttpServer())
				.delete('/' + RouteNames.USERS.USER_ID(createdUserId).full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.USER_ID(createdUserId).full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})
	})
})
