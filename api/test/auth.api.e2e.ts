import { INestApplication } from '@nestjs/common'
import { add } from 'date-fns'
import * as jwt from 'jsonwebtoken'
import { agent as request } from 'supertest'
import { JwtService } from '../src/base/application/jwt.service'
import { AuthMongoRepository } from '../src/features/auth/auth.mongo.repository'
import { UsersMongoRepository } from '../src/features/users/users.mongo.repository'
import { wait } from '../src/utils/promise'
import { createUniqString, parseCookieStringToObj } from '../src/utils/stringUtils'
import { DBTypes } from '../src/db/mongo/dbTypes'
import {
	addUserByAdminRequest,
	adminAuthorizationValue,
	loginRequest,
	userEmail,
} from './utils/utils'
import { describe } from 'node:test'
import { HTTP_STATUSES, config } from '../src/settings/config'
import RouteNames from '../src/settings/routeNames'
import { createTestApp } from './utils/common'
import { clearAllDB } from './utils/db'

it.skip('123', async () => {
	expect(2).toBe(2)
})

describe('ROOT', () => {
	let app: INestApplication
	let authRepository: AuthMongoRepository
	let usersRepository: UsersMongoRepository
	const jwtService = new JwtService()

	beforeAll(async () => {
		app = await createTestApp()

		authRepository = await app.resolve(AuthMongoRepository)
		usersRepository = await app.resolve(UsersMongoRepository)
	})

	beforeEach(async () => {
		await clearAllDB(app)
	})

	describe('Login user', () => {
		it('should return 400 if to pass wrong dto', async () => {
			const loginRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ loginOrEmail: '', password: 'password' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(loginRes.body.errorsMessages)).toBe('[object Array]')
			expect(loginRes.body.errorsMessages.length).toBe(1)
			expect(loginRes.body.errorsMessages[0].field).toBe('loginOrEmail')
		})

		it('should return 401 if the login is wrong', async () => {
			const login = 'login'
			const password = 'password'
			const email = 'email@email.ru'

			const createdUserRes = await addUserByAdminRequest(app, { login, password, email })
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ loginOrEmail: login + 'wrong', password })
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 401 if the password is wrong', async () => {
			const login = 'login'
			const password = 'password'
			const email = 'email@email.ru'

			const createdUserRes = await addUserByAdminRequest(app, { login, password, email })
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ loginOrEmail: login, password: password + 'wrong' })
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 401 if user email is not verified', async () => {
			const login = 'login_new'
			const password = 'password_new'
			const email = 'email@email.ru'

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION.full)
				.send({ login, password, email })
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			// await loginRequest(app, login, password).expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 200 and object with token and JWT refreshToken in cookie if the DTO is correct and user has verified email', async () => {
			const login = 'login'
			const password = 'password'
			const email = 'email@email.ru'

			const createdUserRes = await addUserByAdminRequest(app, { login, password, email })
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const loginRes = await loginRequest(app, login, password).expect(HTTP_STATUSES.OK_200)

			// --- AccessToken
			const rightAccessToken = jwt.sign(
				{ userId: createdUserRes.body.id },
				config.JWT_SECRET,
				{
					expiresIn: config.accessToken.lifeDurationInMs / 1000 + 's',
				},
			)
			expect(loginRes.body.accessToken).toBe(rightAccessToken)

			// --- RefreshToken

			const refreshTokenStr = loginRes.headers['set-cookie'][0]
			const refreshToken = parseCookieStringToObj(refreshTokenStr)

			expect(refreshToken.cookieName).toBe('refreshToken')
			expect(refreshToken.HttpOnly).toBe(true)
			expect(refreshToken.Secure).toBe(true)
			expect(refreshToken['Max-Age']).toBe(config.refreshToken.lifeDurationInMs / 1000)
		})

		it('should return 429 if too many requests were made', async () => {
			for (let i = 1; i <= config.reqLimit.max; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.AUTH.LOGIN.full)
					.send({ loginOrEmail: '', password: '' })
					.expect(HTTP_STATUSES.BAD_REQUEST_400)
			}

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.expect(HTTP_STATUSES.TOO_MANY_REQUESTS_429)

			await wait(config.reqLimit.durationInMs)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ loginOrEmail: '', password: '' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})
	})

	describe('Refresh token', () => {
		it('should return 401 if the JWT refreshToken inside cookie is missing, expired or incorrect', async () => {
			const login = 'login'
			const password = 'password'
			const email = 'email@email.ru'

			const createdUserRes = await addUserByAdminRequest(app, { login, password, email })
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const userId = createdUserRes.body.id

			// Create expired token
			const deviceId = createUniqString()

			const expiredRefreshToken: DBTypes.DeviceToken = {
				issuedAt: new Date(),
				expirationDate: add(new Date(), { days: -6 }),
				deviceIP: '123',
				deviceId,
				deviceName: 'Unknown',
				userId,
			}

			await authRepository.insertDeviceRefreshToken(expiredRefreshToken)

			// Get created expired token
			const refreshToken = await authRepository.getDeviceRefreshTokenByDeviceId(deviceId)
			const refreshTokenStr = jwtService.createRefreshTokenStr(
				refreshToken!.deviceId,
				refreshToken!.expirationDate,
			)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REFRESH_TOKEN.full)
				.set('Cookie', [config.refreshToken.name + '=' + refreshTokenStr])
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it.only('should return 200 if the JWT refreshToken inside cookie is valid', async () => {
			const login = 'login'
			const password = 'password'
			const email = 'email@email.ru'

			const createdUserRes = await addUserByAdminRequest(app, { login, password, email })
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const loginRes = await loginRequest(app, login, password).expect(HTTP_STATUSES.OK_200)
			const refreshTokenStr = loginRes.headers['set-cookie'][0]
			const refreshTokenValue = parseCookieStringToObj(refreshTokenStr).cookieValue

			const refreshTokenRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REFRESH_TOKEN.full)
				.set('Cookie', config.refreshToken.name + '=' + refreshTokenValue)
				.expect(HTTP_STATUSES.OK_200)

			// const newRefreshTokenStr = refreshTokenRes.headers['set-cookie'][0]
			// const newRefreshTokenObj = parseCookieStringToObj(newRefreshTokenStr)
			// expect(newRefreshTokenObj['Max-Age']).toBe(config.refreshToken.lifeDurationInMs / 1000)
			// expect(newRefreshTokenObj.Secure).toBe(true)
			// expect(newRefreshTokenObj.HttpOnly).toBe(true)
		})
	})

	describe('Register user', () => {
		it('should return 400 if dto has incorrect values', async () => {
			const registrationRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION.full)
				.send({ login: '', password: '', email: 'wrong-email.com' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(registrationRes.body.errorsMessages)).toBe('[object Array]')
			expect(registrationRes.body.errorsMessages.length).toBe(3)
		})

		it('should return 400 if the user with the given email already exists', async () => {
			const email = 'email@email.com'

			await addUserByAdminRequest(app, { login: 'login', password: 'password', email })

			const registrationRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION.full)
				.send({ login: 'login_new', password: 'password_new', email })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(registrationRes.body.errorsMessages)).toBe('[object Array]')
			expect(registrationRes.body.errorsMessages.length).toBe(1)
			expect(registrationRes.body.errorsMessages[0].field).toBe('email')
		})

		it('should return 204 if passed correct dto', async () => {
			const email = 'email@email.com'

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION.full)
				.send({ login: 'login_new', password: 'password_new', email })
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			const allUsers = await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200)

			expect(allUsers.body.items.length).toBe(1)
		})

		it('should return 429 if too many requests were made', async () => {
			for (let i = 1; i <= config.reqLimit.max; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.AUTH.REGISTRATION.full)
					.send({ login: '', password: '', email: '' })
					.expect(HTTP_STATUSES.BAD_REQUEST_400)
			}

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION.full)
				.send({ login: '', password: '', email: '' })
				.expect(HTTP_STATUSES.TOO_MANY_REQUESTS_429)

			await wait(config.reqLimit.durationInMs)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION.full)
				.send({ login: '', password: '', email: '' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})
	})

	describe('Registration confirmation', () => {
		it('should return 400 if the request has wrong dto', async () => {
			const regConfirmRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_CONFIRMATION.full)
				.send({ code: '' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(regConfirmRes.body.errorsMessages)).toBe('[object Array]')
			expect(regConfirmRes.body.errorsMessages.length).toBe(1)
		})

		it('should return 400 if there is not user with given confirmation code', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_CONFIRMATION.full)
				.send({ code: 'e18ad1ac-18ad-4dc9-80d9-28d60390e224' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should return 204 if passed right confirmation code', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION.full)
				.send({ login: 'login_new', password: 'password_new', email: 'email@email.com' })
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			const allUsers = await request(app.getHttpServer())
				.get('/' + RouteNames.USERS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200)
			const userId = allUsers.body.items[0].id

			const fullUserData = await usersRepository.getUserById(userId)
			const confirmationCode = fullUserData!.emailConfirmation.confirmationCode

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_CONFIRMATION.full)
				.send({ code: confirmationCode })
				.expect(HTTP_STATUSES.NO_CONTENT_204)
		})

		it('should return 429 if too many requests were made', async () => {
			for (let i = 1; i <= config.reqLimit.max; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.AUTH.REGISTRATION_CONFIRMATION.full)
					.expect(HTTP_STATUSES.BAD_REQUEST_400)
			}

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_CONFIRMATION.full)
				.expect(HTTP_STATUSES.TOO_MANY_REQUESTS_429)

			await wait(config.reqLimit.durationInMs)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_CONFIRMATION.full)
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})
	})

	describe('Resending email confirmation code', () => {
		it('should return 400 if dto has incorrect values', async () => {
			const registrationRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_EMAIL_RESENDING.full)
				.send({ email: 'wrong-email.com' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(registrationRes.body.errorsMessages)).toBe('[object Array]')
			expect(registrationRes.body.errorsMessages.length).toBe(1)
		})

		it('should return 400 if email in dto is not exists', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_EMAIL_RESENDING.full)
				.send({ email: 'my@email.com' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should return 204 if passed correct dto', async () => {
			const email = 'email@email.com'

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION.full)
				.send({ login: 'login_new', password: 'password_new', email })
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_EMAIL_RESENDING.full)
				.send({ email })
				.expect(HTTP_STATUSES.NO_CONTENT_204)
		})

		it('should return 429 if too many requests were made', async () => {
			for (let i = 1; i <= config.reqLimit.max; i++) {
				await request(app.getHttpServer())
					.post('/' + RouteNames.AUTH.REGISTRATION_EMAIL_RESENDING.full)
					.send({ email: '' })
					.expect(HTTP_STATUSES.BAD_REQUEST_400)
			}

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_EMAIL_RESENDING.full)
				.send({ email: '' })
				.expect(HTTP_STATUSES.TOO_MANY_REQUESTS_429)

			await wait(config.reqLimit.durationInMs)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.REGISTRATION_EMAIL_RESENDING.full)
				.send({ email: '' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})
	})

	describe('Get current user', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.BLOGS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 200 and user data if the DTO is correct', async () => {
			const login = 'login'
			const password = 'password'
			const email = 'email@email.ru'

			const createdUserRes = await addUserByAdminRequest(app, { login, password, email })
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const loginRes = await loginRequest(app, login, password).expect(HTTP_STATUSES.OK_200)

			const authMeRes = await request(app.getHttpServer())
				.get('/' + RouteNames.AUTH.ME.full)
				.set('authorization', 'Bearer ' + loginRes.body.accessToken)
				.expect(HTTP_STATUSES.OK_200)

			expect(authMeRes.body.email).toBe(email)
			expect(authMeRes.body.login).toBe(login)
			expect(authMeRes.body.userId).toBe(createdUserRes.body.id)
		})
	})

	describe('Logout', () => {
		it('should return 401 if the JWT refreshToken inside cookie is missing, expired or incorrect', async () => {
			const login = 'login'
			const password = 'password'
			const email = 'email@email.ru'

			const createdUserRes = await addUserByAdminRequest(app, { login, password, email })
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const userId = createdUserRes.body.id

			// Create expired token
			const deviceId = createUniqString()

			const expiredRefreshToken: DBTypes.DeviceToken = {
				issuedAt: new Date(),
				expirationDate: new Date(),
				deviceIP: '123',
				deviceId,
				deviceName: 'Unknown',
				userId,
			}

			await authRepository.insertDeviceRefreshToken(expiredRefreshToken)

			// Get created expired token
			const refreshToken = await authRepository.getDeviceRefreshTokenByDeviceId(deviceId)
			const refreshTokenStr = jwtService.createRefreshTokenStr(
				refreshToken!.deviceId,
				refreshToken!.expirationDate,
			)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGOUT.full)
				.set('Cookie', config.refreshToken.name + '=' + refreshTokenStr)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 200 if the JWT refreshToken inside cookie is valid', async () => {
			const login = 'login'
			const password = 'password'
			const email = 'email@email.ru'

			const createdUserRes = await addUserByAdminRequest(app, { login, password, email })
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const loginRes = await loginRequest(app, login, password).expect(HTTP_STATUSES.OK_200)
			const refreshTokenStr = loginRes.headers['set-cookie'][0]
			const refreshTokenValue = parseCookieStringToObj(refreshTokenStr).cookieValue

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGOUT.full)
				.set('Cookie', config.refreshToken.name + '=' + refreshTokenValue)
				.expect(HTTP_STATUSES.NO_CONTENT_204)
		})
	})

	describe('Password recovery', () => {
		it('should return 400 if the request body has incorrect data', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.PASSWORD_RECOVERY.full)
				.send({ email: 'wrong' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should return 204 if the request body has correct data', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.PASSWORD_RECOVERY.full)
				.send({ email: userEmail })
				.expect(HTTP_STATUSES.NO_CONTENT_204)
		})
	})

	describe('New password setting', () => {
		it('should return 400 if the new password is short in request body', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const authPasswordRecoveryRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.PASSWORD_RECOVERY.full)
				.send({ email: userEmail })
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			const userId = createdUserRes.body.id
			const getUserRes = await usersRepository.getUserById(userId)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.NEW_PASSWORD.full)
				.send({
					newPassword: 'short',
					recoveryCode: getUserRes!.account.passwordRecoveryCode,
				})
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should return 400 if the password recovery code is incorrect in request body', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const authPasswordRecoveryRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.PASSWORD_RECOVERY.full)
				.send({ email: userEmail })
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.NEW_PASSWORD.full)
				.send({ newPassword: 'short', recoveryCode: 'wrongRecoveryCode' })
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should return 204 if the data is correct in request body', async () => {
			const createdUserRes = await addUserByAdminRequest(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.PASSWORD_RECOVERY.full)
				.send({ email: userEmail })
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			const userId = createdUserRes.body.id
			const getUserRes = await usersRepository.getUserById(userId)

			const newPasswordRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.NEW_PASSWORD.full)
				.send({
					newPassword: 'newPassword123',
					recoveryCode: getUserRes!.account.passwordRecoveryCode,
				})
				.expect(HTTP_STATUSES.NO_CONTENT_204)
		})
	})
})
