import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { DeviceToken, DeviceTokenDocument } from '../../db/mongo/schemas/deviceToken.schema'
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

		const userDevicesRes = await this.dataSource.query(
			'SELECT * FROM devicetokens WHERE userid = $1',
			[user.id],
		)

		return userDevicesRes.map(this.mapDbUserDeviceToOutputUserDevice)
	}

	mapDbUserDeviceToOutputUserDevice(
		DbUserRefreshToken: PGGetDeviceTokensQuery,
	): UserDeviceOutModel {
		return {
			ip: DbUserRefreshToken.deviceip, // IP address of device
			title: DbUserRefreshToken.devicename, // Chrome 105
			lastActiveDate: new Date(DbUserRefreshToken.issuedat).toISOString(), // Date of the last generating of refresh/access tokens
			deviceId: DbUserRefreshToken.deviceid.toString(), // Id of the connected device session
		}
	}
}
