import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { addMilliseconds } from 'date-fns'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
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
export class AuthMongoRepository {
	constructor(
		@InjectModel(User.name) private UserModel: Model<User>,
		@InjectModel(DeviceToken.name) private DeviceTokenModel: Model<DeviceToken>,
		private hashService: HashAdapter,
		private commonService: CommonService,
		private jwtService: JwtService,
	) {}

	async getUserByRefreshToken(refreshTokenStr: string) {
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
	}

	async getUserByEmail(loginOrEmail: string) {
		const getUserRes = await this.UserModel.findOne({
			'account.email': loginOrEmail,
		})

		if (!getUserRes) {
			return null
		}

		return this.mapDbUserToServiceUser(getUserRes)
	}

	async getUserByLoginOrEmail(loginOrEmail: string) {
		const getUserRes = await this.UserModel.findOne({
			$or: [{ 'account.login': loginOrEmail }, { 'account.email': loginOrEmail }],
		})

		if (!getUserRes) {
			return null
		}

		return this.mapDbUserToServiceUser(getUserRes)
	}

	async getUserByLoginOrEmailAndPassword(loginDto: { loginOrEmail: string; password: string }) {
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
	}

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
		const getUserRes = await this.UserModel.findOne({
			'emailConfirmation.confirmationCode': confirmationCode,
		})

		if (!getUserRes) {
			return null
		}

		return this.mapDbUserToServiceUser(getUserRes)
	}

	async createUser(dto: DBTypes.User) {
		return this.commonService.createUser(dto)
	}

	async makeUserEmailConfirmed(userId: string) {
		const updateUserRes = await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'emailConfirmation.isConfirmed': true } },
		)

		return updateUserRes.modifiedCount === 1
	}

	async setNewEmailConfirmationCode(userId: string) {
		const confirmationCode = createUniqString()

		await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'emailConfirmation.confirmationCode': confirmationCode } },
		)

		return confirmationCode
	}

	async deleteUser(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}

	async insertDeviceRefreshToken(deviceRefreshToken: DBTypes.DeviceToken) {
		await this.DeviceTokenModel.insertMany(deviceRefreshToken)
	}

	async getDeviceRefreshTokenByDeviceId(deviceId: string): Promise<null | DBTypes.DeviceToken> {
		const getTokenRes = await this.DeviceTokenModel.findOne({
			deviceId,
		})
		if (!getTokenRes) return null

		return this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(getTokenRes)
	}

	async deleteDeviceRefreshTokenByDeviceId(deviceId: string): Promise<boolean> {
		const result = await this.DeviceTokenModel.deleteOne({ deviceId })

		return result.deletedCount === 1
	}

	async updateDeviceRefreshTokenDate(deviceId: string): Promise<boolean> {
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
	}

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
	}

	mapDbUserToServiceUser(dbUser: UserDocument): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}

	mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(
		dbDevice: DeviceTokenDocument,
	): DeviceRefreshTokenServiceModel {
		return {
			id: dbDevice._id.toString(),
			issuedAt: dbDevice.issuedAt,
			expirationDate: dbDevice.expirationDate,
			deviceIP: dbDevice.deviceIP,
			deviceId: dbDevice.deviceId,
			deviceName: dbDevice.deviceName,
			userId: dbDevice.userId,
		}
	}
}
