import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DeviceToken } from '../db/pg/entities/deviceToken'

@Injectable()
export class SecurityRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async terminateAllDeviceRefreshTokensApartThis(currentDeviceId: string) {
		const deletedDeviceTokensRes = await this.dataSource
			.getRepository(DeviceToken)
			.createQueryBuilder()
			.delete()
			.where('deviceId != :deviceId', { deviceId: currentDeviceId })
			.execute()

		return deletedDeviceTokensRes.affected === 1
	}

	async deleteRefreshTokenByDeviceId(deviceId: string): Promise<boolean> {
		const deletedDeviceTokensRes = await this.dataSource
			.getRepository(DeviceToken)
			.delete({ deviceId })

		return deletedDeviceTokensRes.affected === 1
	}
}
