import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DeviceToken } from '../db/pg/entities/deviceToken'
import { AuthRepository } from './authRepository/auth.repository'
import {
	GetUserDevicesOutModel,
	UserDeviceOutModel,
} from '../models/security/security.output.model'

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

	mapDbUserDeviceToOutputUserDevice(DbUserRefreshToken: DeviceToken): UserDeviceOutModel {
		return {
			ip: DbUserRefreshToken.deviceIP, // IP address of device
			title: DbUserRefreshToken.deviceName, // Chrome 105
			lastActiveDate: new Date(DbUserRefreshToken.issuedAt).toISOString(), // Date of the last generating of refresh/access tokens
			deviceId: DbUserRefreshToken.deviceId.toString(), // Id of the connected device session
		}
	}
}
