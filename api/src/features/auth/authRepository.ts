import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { addMilliseconds } from 'date-fns'
import { DataSource } from 'typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { DeviceToken } from '../../db/pg/entities/deviceToken'
import { User } from '../../db/pg/entities/user'
import { PGGetUserQuery } from '../../db/pg/getPgDataTypes'
import { config } from '../../settings/config'
import { DBTypes } from '../../db/mongo/dbTypes'
import { LayerResult, LayerResultCode } from '../../types/resultCodes'
import { createUniqString } from '../../utils/stringUtils'
import { CommonService } from '../common/common.service'
import { UserServiceModel } from '../users/models/users.service.model'
import { DeviceRefreshTokenServiceModel } from './model/auth.service.model'

@Injectable()
export class AuthRepository {
	constructor(
		private hashService: HashAdapter,
		private commonService: CommonService,
		private jwtService: JwtService,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getUserByRefreshToken(refreshTokenStr: string) {
		const refreshTokenData = this.jwtService.getRefreshTokenDataFromTokenStr(refreshTokenStr)

		const device = await this.dataSource.getRepository(DeviceToken).findOne({
			where: { deviceId: refreshTokenData!.deviceId },
		})

		if (!device) return null

		const user = await this.dataSource.getRepository(User).findOne({
			where: { id: device.userId },
		})

		if (!user) return null

		return this.mapDbUserToServiceUser(user)
	}

	/*async getUserByRefreshTokenNative(refreshTokenStr: string) {
		const refreshTokenData = this.jwtService.getRefreshTokenDataFromTokenStr(refreshTokenStr)

		const devicesRes = await this.dataSource.query(
			'SELECT * FROM devicetokens WHERE deviceid=$1',
			[refreshTokenData!.deviceId],
		)

		if (!devicesRes.length) {
			return null
		}

		const usersRes = await this.dataSource.query('SELECT * FROM users WHERE id=$1', [
			devicesRes[0].userid,
		])

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}*/

	async getUserByEmail(loginOrEmail: string) {
		const user = await this.dataSource.getRepository(User).findOne({
			where: { email: loginOrEmail },
		})

		if (!user) {
			return null
		}

		return this.mapDbUserToServiceUser(user)
	}

	/*async getUserByEmailNative(loginOrEmail: string) {
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE email='${loginOrEmail}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}*/

	async getUserByLoginOrEmail(loginOrEmail: string) {
		const user = await this.dataSource.getRepository(User).findOne({
			where: [{ login: loginOrEmail }, { email: loginOrEmail }],
		})

		if (!user) return null

		return this.mapDbUserToServiceUser(user)
	}

	/*async getUserByLoginOrEmailNative(loginOrEmail: string) {
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE login='${loginOrEmail}' OR email='${loginOrEmail}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}*/

	async getUserByLoginOrEmailAndPassword(loginDto: { loginOrEmail: string; password: string }) {
		const user = await this.dataSource.getRepository(User).findOne({
			where: [{ login: loginDto.loginOrEmail }, { email: loginDto.loginOrEmail }],
		})

		if (!user) {
			return null
		}

		const isPasswordMath = await this.hashService.compare(loginDto.password, user.password)

		if (!isPasswordMath) {
			return null
		}

		return this.mapDbUserToServiceUser(user)
	}

	/*async getUserByLoginOrEmailAndPasswordNative(loginDto: { loginOrEmail: string; password: string }) {
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE login='${loginDto.loginOrEmail}' OR email='${loginDto.loginOrEmail}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		const isPasswordMath = await this.hashService.compare(
			loginDto.password,
			usersRes[0].password,
		)

		if (!isPasswordMath) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}*/

	async getConfirmedUserByLoginOrEmailAndPassword(loginDto: {
		loginOrEmail: string
		password: string
	}): Promise<LayerResult<UserServiceModel>> {
		const user = await this.getUserByLoginOrEmailAndPassword(loginDto)

		if (!user || !user.emailConfirmation.isConfirmed) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: user,
		}
	}

	/*async getConfirmedUserByLoginOrEmailAndPasswordNative(loginDto: {
		loginOrEmail: string
		password: string
	}): Promise<LayerResult<UserServiceModel>> {
		const user = await this.getUserByLoginOrEmailAndPassword(loginDto)

		if (!user || !user.emailConfirmation.isConfirmed) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: user,
		}
	}*/

	async getUserByConfirmationCode(confirmationCode: string) {
		const user = await this.dataSource.getRepository(User).findOne({
			where: { emailConfirmationCode: confirmationCode },
		})

		if (!user) {
			return null
		}

		return this.mapDbUserToServiceUser(user)
	}

	/*async getUserByConfirmationCodeNative(confirmationCode: string) {
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE emailConfirmationCode='${confirmationCode}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}*/

	async createUser(dto: Omit<PGGetUserQuery, 'id'>) {
		return this.commonService.createUser(dto)
	}

	async makeUserEmailConfirmed(userId: string) {
		const updateUserRes = await this.dataSource.getRepository(User).update(userId, {
			isConfirmationEmailCodeConfirmed: true,
		})

		return updateUserRes.affected === 1
	}

	/*async makeUserEmailConfirmedNative(userId: string) {
		const updateUserRes = await this.dataSource.query(
			`UPDATE users SET isConfirmationEmailCodeConfirmed = '1' WHERE id = ${userId};`,
			[],
		)

		return updateUserRes[1] === 1
	}*/

	async setNewEmailConfirmationCode(userId: string) {
		const confirmationCode = createUniqString()

		await this.dataSource
			.getRepository(User)
			.update(userId, { emailConfirmationCode: confirmationCode })

		return confirmationCode
	}

	/*async setNewEmailConfirmationCodeNative(userId: string) {
		const confirmationCode = createUniqString()

		const updateUserRes = await this.dataSource.query(
			`UPDATE users SET emailConfirmationCode = '${confirmationCode}' WHERE id = ${userId};`,
			[],
		)

		return confirmationCode
	}*/

	async deleteUser(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}

	async insertDeviceRefreshToken(deviceRefreshToken: DBTypes.DeviceToken) {
		await this.dataSource.getRepository(DeviceToken).insert({
			issuedAt: deviceRefreshToken.issuedAt.toISOString(),
			userId: deviceRefreshToken.userId,
			expirationDate: deviceRefreshToken.expirationDate.toISOString(),
			deviceIP: deviceRefreshToken.deviceIP,
			deviceId: deviceRefreshToken.deviceId,
			deviceName: deviceRefreshToken.deviceName,
		})
	}

	/*async insertDeviceRefreshTokenNative(deviceRefreshToken: DBTypes.DeviceToken) {
		await this.dataSource.query(
			`INSERT INTO devicetokens
			("issuedat", "userid", "expirationdate", "deviceip", "deviceid", "devicename")
			VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
			[
				deviceRefreshToken.issuedAt,
				deviceRefreshToken.userId,
				deviceRefreshToken.expirationDate,
				deviceRefreshToken.deviceIP,
				deviceRefreshToken.deviceId,
				deviceRefreshToken.deviceName,
			],
		)
	}*/

	async getDeviceRefreshTokenByDeviceId(deviceId: string): Promise<null | DBTypes.DeviceToken> {
		const token = await this.dataSource.getRepository(DeviceToken).findOneBy({ deviceId })

		if (!token) return null

		return this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(token)
	}

	/*async getDeviceRefreshTokenByDeviceIdNative(deviceId: string): Promise<null | DBTypes.DeviceToken> {
		const tokensRes = await this.dataSource.query(
			`SELECT * FROM devicetokens WHERE deviceId='${deviceId}'`,
			[],
		)

		if (!tokensRes.length) {
			return null
		}

		return this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(tokensRes[0])
	}*/

	async deleteDeviceRefreshTokenByDeviceId(deviceId: string): Promise<boolean> {
		const deleteDeviceTokenRes = await this.dataSource
			.getRepository(DeviceToken)
			.delete({ deviceId })

		return deleteDeviceTokenRes.affected === 1
	}

	/*async deleteDeviceRefreshTokenByDeviceIdNative(deviceId: string): Promise<boolean> {
		// The query will return an array where the second element is a number of deleted documents
		// [ [], 1 ]
		const deletedDeviceTokensRes = await this.dataSource.query(
			'DELETE FROM devicetokens WHERE deviceid = $1',
			[deviceId],
		)

		return deletedDeviceTokensRes[1] === 1
	}*/

	async updateDeviceRefreshTokenDate(deviceId: string): Promise<boolean> {
		const issuedAt = new Date().toISOString()

		const expirationDate = new Date(
			addMilliseconds(new Date(), config.refreshToken.lifeDurationInMs),
		)

		const updateDevicesRes = await this.dataSource
			.createQueryBuilder()
			.update(DeviceToken)
			.set({ issuedAt, expirationDate })
			.where('deviceId = :deviceId', { deviceId })
			.execute()

		return updateDevicesRes.affected === 1
	}

	/*async updateDeviceRefreshTokenDateNative(deviceId: string): Promise<boolean> {
		const issuedAt = new Date().toISOString()
		const expirationDate = new Date(
			addMilliseconds(new Date(), config.refreshToken.lifeDurationInMs),
		)

		const updateDevicesRes = await this.dataSource.query(
			'UPDATE devicetokens SET issuedat = $1, expirationdate = $2 WHERE deviceid = $3',
			[issuedAt, expirationDate, deviceId],
		)

		return updateDevicesRes[1] === 1
	}*/

	async getDeviceRefreshTokenByTokenStr(tokenStr: string): Promise<null | DBTypes.DeviceToken> {
		try {
			const refreshTokenPayload = this.jwtService.getRefreshTokenDataFromTokenStr(tokenStr)
			return this.getDeviceRefreshTokenByDeviceId(refreshTokenPayload!.deviceId)
		} catch (err: unknown) {
			return null
		}
	}

	/*async getDeviceRefreshTokenByTokenStrNative(tokenStr: string): Promise<null | DBTypes.DeviceToken> {
		try {
			const refreshTokenPayload = this.jwtService.getRefreshTokenDataFromTokenStr(tokenStr)
			return this.getDeviceRefreshTokenByDeviceId(refreshTokenPayload!.deviceId)
		} catch (err: unknown) {
			return null
		}
	}*/

	async getUserDevicesByDeviceId(deviceId: string): Promise<LayerResult<DBTypes.DeviceToken[]>> {
		const userByDeviceToken = await this.dataSource
			.getRepository(DeviceToken)
			.findOneBy({ deviceId })

		if (!userByDeviceToken) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		const { userId } = userByDeviceToken

		const userDevices = await this.dataSource.getRepository(DeviceToken).findBy({ userId })

		if (!userDevices.length) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: userDevices.map(this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken),
		}
	}

	/*async getUserDevicesByDeviceIdNative(deviceId: string): Promise<LayerResult<DBTypes.DeviceToken[]>> {
		const usersByDeviceTokenRes = await this.dataSource.query(
			'SELECT userid FROM devicetokens WHERE deviceid = $1',
			[deviceId],
		)

		if (!usersByDeviceTokenRes.length) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		const userId = usersByDeviceTokenRes[0].userid

		const userDevicesRes = await this.dataSource.query(
			'SELECT * FROM devicetokens WHERE userid = $1',
			[userId],
		)

		if (!userDevicesRes.length) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: userDevicesRes.map(this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken),
		}
	}*/

	mapDbUserToServiceUser(dbUser: User): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}

	mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(
		dbDevice: DeviceToken,
	): DeviceRefreshTokenServiceModel {
		return {
			id: dbDevice.id.toString(),
			issuedAt: new Date(dbDevice.issuedAt),
			expirationDate: new Date(dbDevice.expirationDate),
			deviceIP: dbDevice.deviceIP,
			deviceId: dbDevice.deviceId,
			deviceName: dbDevice.deviceName,
			userId: dbDevice.userId.toString(),
		}
	}
}
