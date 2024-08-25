import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { addMilliseconds } from 'date-fns'
import { DataSource } from 'typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { JwtService } from '../../base/application/jwt.service'
import { DeviceToken } from '../../db/pg/entities/deviceToken'
import { User } from '../../db/pg/entities/user'
import { PGGetUserQuery } from '../../db/pg/getPgDataTypes'
import { DeviceTokenOutModel } from '../../models/auth/auth.output.model'
import { config } from '../../settings/config'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { createUniqString } from '../../utils/stringUtils'
import { CommonService } from '../../routes/common/common.service'
import { UserServiceModel } from '../../models/users/users.service.model'
import { DeviceRefreshTokenServiceModel } from './auth.service.model'

@Injectable()
export class AuthRepository {
	constructor(
		private hashService: HashAdapter,
		private commonService: CommonService,
		private jwtService: JwtService,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getUserByRefreshToken(refreshTokenStr: string) {
		const refreshTokenData = this.jwtService.getRefreshTokenDataFromTokenStr(refreshTokenStr)

		const device = await this.dataSource.getRepository(DeviceToken).findOne({
			where: { deviceId: refreshTokenData!.deviceId },
		})

		if (!device) return null

		const user = await this.dataSource.getRepository(User).findOne({
			where: { id: device.userId },
		})

		if (!user) return null

		return this.mapDbUserToServiceUser(user)
	}

	async getUserByEmail(loginOrEmail: string) {
		const user = await this.dataSource.getRepository(User).findOne({
			where: { email: loginOrEmail },
		})

		if (!user) {
			return null
		}

		return this.mapDbUserToServiceUser(user)
	}

	async getUserByLoginOrEmail(loginOrEmail: string) {
		const user = await this.dataSource.getRepository(User).findOne({
			where: [{ login: loginOrEmail }, { email: loginOrEmail }],
		})

		if (!user) return null

		return this.mapDbUserToServiceUser(user)
	}

	async getUserByLoginOrEmailAndPassword(loginDto: { loginOrEmail: string; password: string }) {
		const user = await this.dataSource.getRepository(User).findOne({
			where: [{ login: loginDto.loginOrEmail }, { email: loginDto.loginOrEmail }],
		})

		if (!user) {
			return null
		}

		const isPasswordMath = await this.hashService.compare(loginDto.password, user.password)

		if (!isPasswordMath) {
			return null
		}

		return this.mapDbUserToServiceUser(user)
	}

	async getConfirmedUserByLoginOrEmailAndPassword(loginDto: {
		loginOrEmail: string
		password: string
	}): Promise<LayerResult<UserServiceModel>> {
		const user = await this.getUserByLoginOrEmailAndPassword(loginDto)

		if (!user || !user.emailConfirmation.isConfirmed) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: user,
		}
	}

	async getUserByConfirmationCode(confirmationCode: string) {
		const user = await this.dataSource.getRepository(User).findOne({
			where: { emailConfirmationCode: confirmationCode },
		})

		if (!user) {
			return null
		}

		return this.mapDbUserToServiceUser(user)
	}

	async createUser(dto: Omit<PGGetUserQuery, 'id'>) {
		return this.commonService.createUser(dto)
	}

	async makeUserEmailConfirmed(userId: string) {
		const updateUserRes = await this.dataSource.getRepository(User).update(userId, {
			isConfirmationEmailCodeConfirmed: true,
		})

		return updateUserRes.affected === 1
	}

	async setNewEmailConfirmationCode(userId: string) {
		const confirmationCode = createUniqString()

		await this.dataSource
			.getRepository(User)
			.update(userId, { emailConfirmationCode: confirmationCode })

		return confirmationCode
	}

	async deleteUser(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}

	async insertDeviceRefreshToken(deviceRefreshToken: DeviceTokenOutModel) {
		await this.dataSource.getRepository(DeviceToken).insert({
			issuedAt: new Date(deviceRefreshToken.issuedAt).toISOString(),
			userId: deviceRefreshToken.userId,
			expirationDate: new Date(deviceRefreshToken.expirationDate).toISOString(),
			deviceIP: deviceRefreshToken.deviceIP,
			deviceId: deviceRefreshToken.deviceId,
			deviceName: deviceRefreshToken.deviceName,
		})
	}

	async getDeviceRefreshTokenByDeviceId(
		deviceId: string,
	): Promise<null | DeviceRefreshTokenServiceModel> {
		const token = await this.dataSource.getRepository(DeviceToken).findOneBy({ deviceId })

		if (!token) return null

		return this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(token)
	}

	async deleteDeviceRefreshTokenByDeviceId(deviceId: string): Promise<boolean> {
		const deleteDeviceTokenRes = await this.dataSource
			.getRepository(DeviceToken)
			.delete({ deviceId })

		return deleteDeviceTokenRes.affected === 1
	}

	async updateDeviceRefreshTokenDate(deviceId: string): Promise<boolean> {
		const issuedAt = new Date().toISOString()

		const expirationDate = new Date(
			addMilliseconds(new Date(), config.refreshToken.lifeDurationInMs),
		)

		const updateDevicesRes = await this.dataSource
			.createQueryBuilder()
			.update(DeviceToken)
			.set({ issuedAt, expirationDate })
			.where('deviceId = :deviceId', { deviceId })
			.execute()

		return updateDevicesRes.affected === 1
	}

	async getDeviceRefreshTokenByTokenStr(
		tokenStr: string,
	): Promise<null | DeviceRefreshTokenServiceModel> {
		try {
			const refreshTokenPayload = this.jwtService.getRefreshTokenDataFromTokenStr(tokenStr)
			return this.getDeviceRefreshTokenByDeviceId(refreshTokenPayload!.deviceId)
		} catch (err: unknown) {
			return null
		}
	}

	async getUserDevicesByDeviceId(
		deviceId: string,
	): Promise<LayerResult<DeviceRefreshTokenServiceModel[]>> {
		const userByDeviceToken = await this.dataSource
			.getRepository(DeviceToken)
			.findOneBy({ deviceId })

		if (!userByDeviceToken) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const { userId } = userByDeviceToken

		const userDevices = await this.dataSource.getRepository(DeviceToken).findBy({ userId })

		if (!userDevices.length) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: userDevices.map(this.mapDbDeviceRefreshTokenToServiceDeviceRefreshToken),
		}
	}

	mapDbUserToServiceUser(dbUser: User): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}

	mapDbDeviceRefreshTokenToServiceDeviceRefreshToken(
		dbDevice: DeviceToken,
	): DeviceRefreshTokenServiceModel {
		return {
			id: dbDevice.id.toString(),
			issuedAt: new Date(dbDevice.issuedAt),
			expirationDate: new Date(dbDevice.expirationDate),
			deviceIP: dbDevice.deviceIP,
			deviceId: dbDevice.deviceId,
			deviceName: dbDevice.deviceName,
			userId: dbDevice.userId.toString(),
		}
	}
}
