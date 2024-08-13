import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { CreateUserDtoModel } from '../../src/features/users/models/users.input.model'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { adminAuthorizationValue, userEmail, userLogin, userPassword } from './common'

export const userUtils = {
	createDtoAddUser(newUserObj: Partial<CreateUserDtoModel> = {}): CreateUserDtoModel {
		return Object.assign(
			{
				login: userLogin,
				password: userPassword,
				email: userEmail,
			},
			newUserObj,
		)
	},
	// Register user
	async createUniqueUser(app: INestApplication, userDto: Partial<CreateUserDtoModel> = {}) {
		const userName = this.createRandomString()

		const createUserDto = this.createDtoAddUser({
			login: userDto.login || userName,
			password: userDto.password || userName + '_password',
			email: userDto.email || userName + '@email.com',
		})

		return await request(app.getHttpServer())
			.post('/' + RouteNames.USERS.value)
			.send(createUserDto)
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.set('authorization', adminAuthorizationValue)
	},
	async loginUser(app: INestApplication, loginOrEmail: string, password: string) {
		return request(app.getHttpServer())
			.post('/' + RouteNames.AUTH.LOGIN.full)
			.send({ loginOrEmail, password })
	},
	async createUniqueUserAndLogin(
		app: INestApplication,
		userDto: Partial<CreateUserDtoModel> = {},
	) {
		const userName = this.createRandomString()

		const createUserDto = this.createDtoAddUser({
			login: userDto.login || userName,
			password: userDto.password || userName + '_password',
			email: userDto.email || userName + '@email.com',
		})

		const createdUserRes = await this.createUniqueUser(app, createUserDto)
		expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

		const loginUserRes = await this.loginUser(app, createUserDto.login, createUserDto.password)
		const userAccessToken = loginUserRes.body.accessToken

		return [userAccessToken, createdUserRes.body.id, createdUserRes.body.login]
	},
	createRandomString() {
		return Math.random().toString(36).substr(2, 8) // 'd4jgn58d'
	},
	checkUserObj(userObj: any) {
		expect(userObj._id).toBe(undefined)
		expect(typeof userObj.id).toBe('string')
		expect(userObj.login).toMatch(/^[a-zA-Z0-9_-]*$/)
		expect(typeof userObj.email).toBe('string')
		expect(userObj.email).toMatch(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
		expect(userObj.createdAt).toMatch(
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
		)
	},
	checkUserDeviceObj(userDeviceObj: any) {
		expect(userDeviceObj).toEqual({
			ip: expect.any(String),
			title: expect.any(String),
			lastActiveDate: expect.any(String),
			deviceId: expect.any(String),
		})

		expect(userDeviceObj.lastActiveDate).toMatch(
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
		)
	},
}
