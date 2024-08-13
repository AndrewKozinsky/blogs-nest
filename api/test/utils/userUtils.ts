import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { CreateUserDtoModel } from '../../src/features/users/models/users.input.model'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { adminAuthorizationValue, userEmail, userLogin, userPassword } from './utils'

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
		})

		const createdUserRes = await this.addUserByAdminReq(app, createUserDto)
		expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)

		const loginUserRes = await this.loginReq(app, createUserDto.login, createUserDto.password)
		const userAccessToken = loginUserRes.body.accessToken

		return [userAccessToken, createdUserRes.body.id, createdUserRes.body.login]
	},
	createRandomString() {
		return Math.random().toString(36).substr(2, 8) // 'd4jgn58d'
	},
}
