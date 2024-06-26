import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
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
				code: LayerResultCode.Unauthorized,
			}
		}

		// Throw en error if the user was removed
		const user = await this.usersRepository.getUserById(deviceRefreshToken.userId)
		if (!user) {
			return {
				code: LayerResultCode.Unauthorized,
			}
		}

		await this.authRepository.updateDeviceRefreshTokenDate(deviceRefreshToken.deviceId)

		const newRefreshToken = this.jwtService.createRefreshTokenStr(deviceRefreshToken.deviceId)

		return {
			code: LayerResultCode.Success,
			data: {
				newAccessToken: this.jwtService.createAccessTokenStr(deviceRefreshToken.userId),
				newRefreshToken,
			},
		}
	}
}
