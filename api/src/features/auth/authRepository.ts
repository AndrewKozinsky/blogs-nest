import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { addMilliseconds } from 'date-fns'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { PGGetDeviceTokensQuery, PGGetUserQuery } from '../../db/pg/blogs'
import { config } from '../../settings/config'
import { DBTypes } from '../../db/mongo/dbTypes'
import { User, UserDocument } from '../../db/mongo/schemas/user.schema'
import { DeviceToken, DeviceTokenDocument } from '../../db/mongo/schemas/deviceToken.schema'
import { LayerResult, LayerResultCode } from '../../types/resultCodes'
import { createUniqString } from '../../utils/stringUtils'
import { CommonService } from '../common/common.service'
import { UserServiceModel } from '../users/models/users.service.model'
import { DeviceRefreshTokenServiceModel } from './model/auth.service.model'

@Injectable()
export class AuthRepository {
	constructor(
		@InjectModel(User.name) private UserModel: Model<User>,
		@InjectModel(DeviceToken.name) private DeviceTokenModel: Model<DeviceToken>,
		private hashService: HashAdapter,
		private commonService: CommonService,
		private jwtService: JwtService,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getUserByRefreshToken(refreshTokenStr: string) {
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
	}

	/*async getUserByRefreshTokenByMongo(refreshTokenStr: string) {
		const refreshTokenData = this.jwtService.getRefreshTokenDataFromTokenStr(refreshTokenStr)

		const getDeviceRes = await this.DeviceTokenModel.findOne({
			deviceId: refreshTokenData!.deviceId,
		}).lean()

		if (!getDeviceRes) {
			return null
		}

		const getUserRes = await this.UserModel.findOne({
			_id: new ObjectId(getDeviceRes.userId),
		})

		if (!getUserRes) {
			return null
		}

		return this.mapDbUserToServiceUser(getUserRes)
	}*/

	async getUserByEmail(loginOrEmail: string) {
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE email='${loginOrEmail}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}

	/*async getUserByEmailByMongo(loginOrEmail: string) {
		const getUserRes = await this.UserModel.findOne({
			'account.email': loginOrEmail,
		})

		if (!getUserRes) {
			return null
		}

		return this.mapDbUserToServiceUser(getUserRes)
	}*/

	async getUserByLoginOrEmail(loginOrEmail: string) {
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE login='${loginOrEmail}' OR email='${loginOrEmail}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}

	/*async getUserByLoginOrEmailByMongo(loginOrEmail: string) {
		const getUserRes = await this.UserModel.findOne({
			$or: [{ 'account.login': loginOrEmail }, { 'account.email': loginOrEmail }],
		})

		if (!getUserRes) {
			return null
		}

		return this.mapDbUserToServiceUser(getUserRes)
	}*/

	async getUserByLoginOrEmailAndPassword(loginDto: { loginOrEmail: string; password: string }) {
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
	}

	/*async getUserByLoginOrEmailAndPasswordByMongo(loginDto: { loginOrEmail: string; password: string }) {
		const getUserRes = await this.UserModel.findOne({
			$or: [
				{ 'account.login': loginDto.loginOrEmail },
				{ 'account.email': loginDto.loginOrEmail },
			],
		})

		if (!getUserRes) {
			return null
		}

		const isPasswordMath = await this.hashService.compare(
			loginDto.password,
			getUserRes.account.password,
		)

		if (!isPasswordMath) {
			return null
		}

		return this.mapDbUserToServiceUser(getUserRes)
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

	async getUserByConfirmationCode(confirmationCode: string) {
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE emailConfirmationCode='${confirmationCode}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}

	/*async getUserByConfirmationCodeByMongo(confirmationCode: string) {
		const getUserRes = await this.UserModel.findOne({
			'emailConfirmation.confirmationCode': confirmationCode,
		})

		if (!getUserRes) {
			return null
		}

		return this.mapDbUserToServiceUser(getUserRes)
	}*/

	async createUser(dto: Omit<PGGetUserQuery, 'id'>) {
		return this.commonService.createUser(dto)
	}

	/*async createUserByMongo(dto: DBTypes.User) {
		return this.commonService.createUser(dto)
	}*/

	async makeUserEmailConfirmed(userId: string) {
		const updateUserRes = await this.dataSource.query(
			`UPDATE users SET isConfirmationEmailCodeConfirmed = '1' WHERE id = ${userId};`,
			[],
		)

		return updateUserRes[1] === 1
	}

	/*async makeUserEmailConfirmedByMongo(userId: string) {
		const updateUserRes = await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'emailConfirmation.isConfirmed': true } },
		)

		return updateUserRes.modifiedCount === 1
	}*/

	async setNewEmailConfirmationCode(userId: string) {
		const confirmationCode = createUniqString()

		const updateUserRes = await this.dataSource.query(
			`UPDATE users SET emailConfirmationCode = '${confirmationCode}' WHERE id = ${userId};`,
			[],
		)

		return confirmationCode
	}

	/*async setNewEmailConfirmationCodeByMongo(userId: string) {
		const confirmationCode = createUniqString()

		await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'emailConfirmation.confirmationCode': confirmationCode } },
		)

		return confirmationCode
	}*/

	async deleteUser(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}

	async insertDeviceRefreshToken(deviceRefreshToken: DBTypes.DeviceToken) {
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
	}

	/*async insertDeviceRefreshTokenByMongo(deviceRefreshToken: DBTypes.DeviceToken) {
		await this.DeviceTokenModel.insertMany(deviceRefreshToken)
	}*/

	async getDeviceRefreshTokenByDeviceId(deviceId: string): Promise<null | DBTypes.DeviceToken> {
		const tokensRes = await this.dataSource.query(
			`SELECT * FROM devicetokens WHERE deviceId='${deviceId}'`,
			[],
		)

		if (!tokensRes.length) {
			return null
		}

		return this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(tokensRes[0])
	}

	/*async getDeviceRefreshTokenByDeviceIdByMongo(deviceId: string): Promise<null | DBTypes.DeviceToken> {
		const getTokenRes = await this.DeviceTokenModel.findOne({
			deviceId,
		})
		if (!getTokenRes) return null

		return this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(getTokenRes)
	}*/

	async deleteDeviceRefreshTokenByDeviceId(deviceId: string): Promise<boolean> {
		// The query will return an array where the second element is a number of deleted documents
		// [ [], 1 ]
		const deletedDeviceTokensRes = await this.dataSource.query(
			'DELETE FROM devicetokens WHERE deviceid = $1',
			[deviceId],
		)

		return deletedDeviceTokensRes[1] === 1
	}

	async updateDeviceRefreshTokenDate(deviceId: string): Promise<boolean> {
		const issuedAt = new Date()
		const expirationDate = new Date(
			addMilliseconds(new Date(), config.refreshToken.lifeDurationInMs),
		)

		const updateDevicesRes = await this.dataSource.query(
			'UPDATE devicetokens SET issuedat = $1, expirationdate = $2 WHERE deviceid = $3',
			[issuedAt, expirationDate, deviceId],
		)

		return updateDevicesRes[1] === 1
	}

	/*async updateDeviceRefreshTokenDateByMongo(deviceId: string): Promise<boolean> {
		const result = await this.DeviceTokenModel.updateOne(
			{ deviceId },
			{
				$set: {
					issuedAt: new Date(),
					expirationDate: addMilliseconds(
						new Date(),
						config.refreshToken.lifeDurationInMs,
					),
				},
			},
		)

		return result.modifiedCount === 1
	}*/

	async getDeviceRefreshTokenByTokenStr(tokenStr: string): Promise<null | DBTypes.DeviceToken> {
		try {
			const refreshTokenPayload = this.jwtService.getRefreshTokenDataFromTokenStr(tokenStr)
			return this.getDeviceRefreshTokenByDeviceId(refreshTokenPayload!.deviceId)
		} catch (err: unknown) {
			return null
		}
	}

	/*async findDeviceRefreshTokenInDb(deviceId: string) {
		return this.DeviceTokenModel.findOne({ deviceId }).lean()
	}*/

	async getUserDevicesByDeviceId(deviceId: string): Promise<LayerResult<DBTypes.DeviceToken[]>> {
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
	}

	/*async getUserDevicesByDeviceIdByMongo(deviceId: string): Promise<LayerResult<DBTypes.DeviceToken[]>> {
		const userDevice = await this.DeviceTokenModel.findOne({ deviceId }).lean()

		if (!userDevice) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		const userDevices = await this.DeviceTokenModel.find({ userId: userDevice.userId }).lean()

		if (!userDevices) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: userDevices.map(this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken),
		}
	}*/

	mapDbUserToServiceUser(dbUser: PGGetUserQuery): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}

	mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(
		dbDevice: PGGetDeviceTokensQuery,
	): DeviceRefreshTokenServiceModel {
		return {
			id: dbDevice.id,
			issuedAt: new Date(dbDevice.issuedat),
			expirationDate: new Date(dbDevice.expirationdate),
			deviceIP: dbDevice.deviceip,
			deviceId: dbDevice.deviceid,
			deviceName: dbDevice.devicename,
			userId: dbDevice.userid,
		}
	}
}
