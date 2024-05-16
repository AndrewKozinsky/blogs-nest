import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DeviceToken } from '../../db/mongo/schemas/deviceToken.schema'
import { AuthMongoRepository } from '../auth/auth.mongo.repository'

@Injectable()
export class SecurityMongoRepository {
	constructor(
		@InjectModel(DeviceToken.name) private DeviceTokenModel: Model<DeviceToken>,
		private authRepository: AuthMongoRepository,
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
