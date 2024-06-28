import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DeviceToken } from '../../db/pg/entities/deviceToken'

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

	/*async terminateAllDeviceRefreshTokensApartThisNative(currentDeviceId: string) {
		const deletedDeviceTokensRes = await this.dataSource.query(
			'DELETE FROM devicetokens WHERE deviceid != $1',
			[currentDeviceId],
		)

		return deletedDeviceTokensRes[1] === 1
	}*/

	async deleteRefreshTokenByDeviceId(deviceId: string): Promise<boolean> {
		const deletedDeviceTokensRes = await this.dataSource
			.getRepository(DeviceToken)
			.delete({ deviceId })

		return deletedDeviceTokensRes.affected === 1
	}

	/*async deleteRefreshTokenByDeviceIdNative(deviceId: string): Promise<boolean> {
		const deletedDeviceTokensRes = await this.dataSource.query(
			'DELETE FROM devicetokens WHERE deviceid = $1',
			[deviceId],
		)

		return deletedDeviceTokensRes[1] === 1
	}*/
}
