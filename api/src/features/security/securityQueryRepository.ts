import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DeviceToken } from '../../db/pg/entities/deviceToken'
import { PGGetDeviceTokensQuery } from '../../db/pg/getPgDataTypes'
import { AuthRepository } from '../auth/authRepository'
import { GetUserDevicesOutModel, UserDeviceOutModel } from './model/security.output.model'

@Injectable()
export class SecurityQueryRepository {
	constructor(
		private authRepository: AuthRepository,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getUserDevices(refreshToken: string): Promise<GetUserDevicesOutModel> {
		const user = await this.authRepository.getUserByRefreshToken(refreshToken)
		if (!user) return []

		const userDevices = await this.dataSource
			.getRepository(DeviceToken)
			.findBy({ userId: user.id })

		return userDevices.map(this.mapDbUserDeviceToOutputUserDevice)
	}

	/*async getUserDevicesNative(refreshToken: string): Promise<GetUserDevicesOutModel> {
		const user = await this.authRepository.getUserByRefreshToken(refreshToken)
		if (!user) return []

		const userDevicesRes = await this.dataSource.query(
			'SELECT * FROM devicetokens WHERE userid = $1',
			[user.id],
		)

		return userDevicesRes.map(this.mapDbUserDeviceToOutputUserDevice)
	}*/

	mapDbUserDeviceToOutputUserDevice(DbUserRefreshToken: DeviceToken): UserDeviceOutModel {
		return {
			ip: DbUserRefreshToken.deviceIP, // IP address of device
			title: DbUserRefreshToken.deviceName, // Chrome 105
			lastActiveDate: new Date(DbUserRefreshToken.issuedAt).toISOString(), // Date of the last generating of refresh/access tokens
			deviceId: DbUserRefreshToken.deviceId.toString(), // Id of the connected device session
		}
	}
}
