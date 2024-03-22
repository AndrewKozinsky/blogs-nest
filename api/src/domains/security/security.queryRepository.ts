import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DeviceToken, DeviceTokenDocument } from '../../db/schemas/deviceToken.schema'
import { AuthRepository } from '../auth/auth.repository'
import { GetUserDevicesOutModel, UserDeviceOutModel } from './model/security.output.model'

@Injectable()
export class SecurityQueryRepository {
	constructor(
		@InjectModel(DeviceToken.name) private DeviceTokenModel: Model<DeviceToken>,
		private authRepository: AuthRepository,
	) {}

	async getUserDevices(refreshToken: string): Promise<GetUserDevicesOutModel> {
		const user = await this.authRepository.getUserByRefreshToken(refreshToken)

		const userDevices = await this.DeviceTokenModel.find({ userId: user!.id }).lean()

		return userDevices.map(this.mapDbUserDeviceToOutputUserDevice)
	}

	mapDbUserDeviceToOutputUserDevice(DbUserRefreshToken: DeviceTokenDocument): UserDeviceOutModel {
		return {
			ip: DbUserRefreshToken.deviceIP, // IP address of device
			title: DbUserRefreshToken.deviceName, // Chrome 105
			lastActiveDate: DbUserRefreshToken.issuedAt.toISOString(), // Date of the last generating of refresh/access tokens
			deviceId: DbUserRefreshToken.deviceId, // Id of the connected device session
		}
	}
}
