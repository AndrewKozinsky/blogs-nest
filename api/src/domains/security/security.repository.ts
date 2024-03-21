import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DeviceToken } from '../../db/schemas/DeviceToken.schema'
import { AuthRepository } from '../auth/auth.repository'

@Injectable()
export class SecurityRepository {
	constructor(
		@InjectModel(DeviceToken.name) private DeviceTokenModel: Model<DeviceToken>,
		private authRepository: AuthRepository,
	) {}

	async terminateAllDeviceRefreshTokensApartThis(currentDeviceId: string) {
		const result = await this.DeviceTokenModel.deleteMany({
			deviceId: { $ne: currentDeviceId },
		})

		return result.deletedCount === 1
	}

	async deleteRefreshTokenByDeviceId(deviceId: string): Promise<boolean> {
		const result = await this.DeviceTokenModel.deleteOne({ deviceId })

		return result.deletedCount === 1
	}
}
