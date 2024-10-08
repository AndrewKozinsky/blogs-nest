import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { JwtService } from '../src/base/application/jwt.service'
import { DeviceTokenOutModel } from '../src/models/auth/auth.output.model'
import { AuthRepository } from '../src/repositories/authRepository/auth.repository'
import { HTTP_STATUSES, config } from '../src/settings/config'
import { createUniqString, parseCookieStringToObj } from '../src/utils/stringUtils'
import { userUtils } from './utils/userUtils'
import RouteNames from '../src/settings/routeNames'
import { createTestApp, userLogin, userPassword } from './utils/common'
import { clearAllDB } from './utils/db'

it('123', () => {
	expect(2).toBe(2)
})

describe('ROOT', () => {
	let app: INestApplication
	let authRepository: AuthRepository
	const jwtService = new JwtService()

	beforeAll(async () => {
		app = await createTestApp()

		authRepository = await app.resolve(AuthRepository)
	})

	beforeEach(async () => {
		await clearAllDB(app)
	})

	describe('Getting all user devices', () => {
		it('should forbid a request if there is not refresh token', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.SECURITY.DEVICES.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it.only('should return an array of devices data if a refreshToken inside cookie is valid', async () => {
			const login = 'login'
			const password = 'password'
			const email = 'email@email.ru'

			const createdUserRes = await userUtils.createUniqueUser(app, {
				login,
				password,
				email,
			})
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const loginRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ login, password })
				.expect(HTTP_STATUSES.OK_200)

			const refreshTokenStr = loginRes.headers['set-cookie'][0]
			const refreshToken = refreshTokenStr.split('=')[1]

			const getUserDevicesRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SECURITY.DEVICES.full)
				.set('Cookie', config.refreshToken.name + '=' + refreshToken)
				.expect(HTTP_STATUSES.OK_200)

			userUtils.checkUserDeviceObj(getUserDevicesRes.body[0])
		})
	})

	describe('Terminate specified device session', () => {
		it('should forbid a request from a user without a device refresh token', async () => {
			return request(app.getHttpServer())
				.delete('/' + RouteNames.SECURITY.DEVICES.DEVICE_ID('999').full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should forbid a request from a user with an expired device refresh token', async () => {
			const createdUserRes = await userUtils.createUniqueUser(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const userId = createdUserRes.body.id

			// Create expired token
			const deviceId = createUniqString()

			const expiredRefreshToken: DeviceTokenOutModel = {
				issuedAt: new Date(),
				expirationDate: new Date(),
				deviceIP: '123',
				deviceId,
				deviceName: 'Unknown',
				userId,
			}

			await authRepository.insertDeviceRefreshToken(expiredRefreshToken)

			// Get created expired token
			const refreshToken = authRepository.getDeviceRefreshTokenByDeviceId(deviceId)

			return request(app.getHttpServer())
				.delete('/' + RouteNames.SECURITY.DEVICES.DEVICE_ID('999').full)
				.set('Cookie', config.refreshToken.name + '=' + refreshToken)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 404 if client tries to terminate a non existed device', async () => {
			const createdUserRes = await userUtils.createUniqueUser(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const loginRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ loginOrEmail: userLogin, password: userPassword })
				.expect(HTTP_STATUSES.OK_200)

			const refreshTokenStr = loginRes.headers['set-cookie'][0]
			const refreshTokenValue = parseCookieStringToObj(refreshTokenStr).cookieValue

			return request(app.getHttpServer())
				.delete('/' + RouteNames.SECURITY.DEVICES.DEVICE_ID('999').full)
				.set('Cookie', config.refreshToken.name + '=' + refreshTokenValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return 403 if a client tries to terminate a device which does not belong to him', async () => {
			// Create a user 1
			const createdUser_1_Res = await userUtils.createUniqueUser(app)
			expect(createdUser_1_Res.status).toBe(HTTP_STATUSES.CREATED_201)

			const login_1_Res = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ loginOrEmail: userLogin, password: userPassword })
				.expect(HTTP_STATUSES.OK_200)

			const deviceRefreshTokenUser_1_Str = login_1_Res.headers['set-cookie'][0]
			const deviceRefreshTokenUser_1_Value = parseCookieStringToObj(
				deviceRefreshTokenUser_1_Str,
			).cookieValue

			const deviceId = jwtService.getRefreshTokenDataFromTokenStr(
				deviceRefreshTokenUser_1_Value,
			)!.deviceId

			// Create a user 2
			const login = 'login-2'
			const password = 'password-2'
			const email = 'email-2@email.ru'

			const createdUser_2_Res = await userUtils.createUniqueUser(app, {
				login,
				password,
				email,
			})
			expect(createdUser_2_Res.status).toBe(HTTP_STATUSES.CREATED_201)

			const login_2_Res = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ loginOrEmail: login, password: password })
				.expect(HTTP_STATUSES.OK_200)

			const deviceRefreshTokenUser_2_Str = login_2_Res.headers['set-cookie'][0]
			const deviceRefreshTokenUser_2_Value = parseCookieStringToObj(
				deviceRefreshTokenUser_2_Str,
			).cookieValue

			request(app.getHttpServer())
				.delete('/' + RouteNames.SECURITY.DEVICES.DEVICE_ID(deviceId).full)
				.set('Cookie', config.refreshToken.name + '=' + deviceRefreshTokenUser_2_Value)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('should return 204 if a client tries to terminate his device', async () => {
			const createdUserRes = await userUtils.createUniqueUser(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const loginRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ loginOrEmail: userLogin, password: userPassword })
				.expect(HTTP_STATUSES.OK_200)

			const deviceRefreshTokenStr = loginRes.headers['set-cookie'][0]
			const deviceRefreshTokenValue =
				parseCookieStringToObj(deviceRefreshTokenStr).cookieValue

			const deviceId =
				jwtService.getRefreshTokenDataFromTokenStr(deviceRefreshTokenValue)!.deviceId

			return request(app.getHttpServer())
				.delete('/' + RouteNames.SECURITY.DEVICES.DEVICE_ID(deviceId).full)
				.set('Cookie', config.refreshToken.name + '=' + deviceRefreshTokenValue)
				.expect(HTTP_STATUSES.NO_CONTENT_204)
		})
	})

	describe('Terminate this device session', () => {
		it('should forbid a request from a user without a device refresh token', async () => {
			return request(app.getHttpServer())
				.delete('/' + RouteNames.SECURITY.DEVICES.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should forbid a request from a user with an expired device refresh token', async () => {
			const createdUserRes = await userUtils.createUniqueUser(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const userId = createdUserRes.body.id

			// Create expired token
			const deviceId = createUniqString()

			const expiredRefreshToken: DeviceTokenOutModel = {
				issuedAt: new Date(),
				expirationDate: new Date(),
				deviceIP: '123',
				deviceId,
				deviceName: 'Unknown',
				userId,
			}

			await authRepository.insertDeviceRefreshToken(expiredRefreshToken)

			// Get created expired token
			const refreshToken = authRepository.getDeviceRefreshTokenByDeviceId(deviceId)

			return request(app.getHttpServer())
				.delete('/' + RouteNames.SECURITY.DEVICES.full)
				.set('Cookie', config.refreshToken.name + '=' + refreshToken)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 204 if a client tries to terminate current device', async () => {
			const createdUserRes = await userUtils.createUniqueUser(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const loginRes = await request(app.getHttpServer())
				.post('/' + RouteNames.AUTH.LOGIN.full)
				.send({ loginOrEmail: userLogin, password: userPassword })
				.expect(HTTP_STATUSES.OK_200)

			const deviceRefreshTokenStr = loginRes.headers['set-cookie'][0]
			const deviceRefreshTokenValue =
				parseCookieStringToObj(deviceRefreshTokenStr).cookieValue

			return request(app.getHttpServer())
				.delete('/' + RouteNames.SECURITY.DEVICES.full)
				.set('Cookie', config.refreshToken.name + '=' + deviceRefreshTokenValue)
				.expect(HTTP_STATUSES.NO_CONTENT_204)
		})
	})
})
