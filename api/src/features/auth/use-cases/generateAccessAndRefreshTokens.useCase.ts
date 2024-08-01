import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { UsersRepository } from '../../users/usersRepository'
import { AuthRepository } from '../authRepository'

@Injectable()
export class GenerateAccessAndRefreshTokensUseCase {
	constructor(
		private authRepository: AuthRepository,
		private jwtService: JwtService,
		private usersRepository: UsersRepository,
	) {}

	async execute(
		deviceRefreshToken: null | DBTypes.DeviceToken,
	): Promise<LayerResult<{ newAccessToken: string; newRefreshToken: string }>> {
		if (!deviceRefreshToken) {
			return {
				code: LayerErrorCode.Unauthorized,
			}
		}

		// Throw en error if the user was removed
		const user = await this.usersRepository.getUserById(deviceRefreshToken.userId)
		if (!user) {
			return {
				code: LayerErrorCode.Unauthorized,
			}
		}

		await this.authRepository.updateDeviceRefreshTokenDate(deviceRefreshToken.deviceId)

		const newRefreshToken = this.jwtService.createRefreshTokenStr(deviceRefreshToken.deviceId)

		return {
			code: LayerSuccessCode.Success,
			data: {
				newAccessToken: this.jwtService.createAccessTokenStr(deviceRefreshToken.userId),
				newRefreshToken,
			},
		}
	}
}
