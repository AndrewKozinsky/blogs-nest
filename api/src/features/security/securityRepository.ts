import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { DeviceToken } from '../../db/mongo/schemas/deviceToken.schema'
import { AuthRepository } from '../auth/authRepository'

@Injectable()
export class SecurityRepository {
	constructor(
		@InjectModel(DeviceToken.name) private DeviceTokenModel: Model<DeviceToken>,
		private authRepository: AuthRepository,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async terminateAllDeviceRefreshTokensApartThis(currentDeviceId: string) {
		const deletedDeviceTokensRes = await this.dataSource.query(
			'DELETE FROM devicetokens WHERE deviceid != $1',
			[currentDeviceId],
		)

		return deletedDeviceTokensRes[1] === 1
	}

	/*async terminateAllDeviceRefreshTokensApartThisByMongo(currentDeviceId: string) {
		const result = await this.DeviceTokenModel.deleteMany({
			deviceId: { $ne: currentDeviceId },
		})

		return result.deletedCount === 1
	}*/

	async deleteRefreshTokenByDeviceId(deviceId: string): Promise<boolean> {
		const deletedDeviceTokensRes = await this.dataSource.query(
			'DELETE FROM devicetokens WHERE deviceid = $1',
			[deviceId],
		)

		return deletedDeviceTokensRes[1] === 1
	}

	/*async deleteRefreshTokenByDeviceIdByMongo(deviceId: string): Promise<boolean> {
		const result = await this.DeviceTokenModel.deleteOne({ deviceId })

		return result.deletedCount === 1
	}*/
}
