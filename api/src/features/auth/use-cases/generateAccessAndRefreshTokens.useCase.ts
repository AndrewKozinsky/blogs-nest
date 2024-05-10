import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { DBTypes } from '../../../db/dbTypes'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { UsersMongoRepository } from '../../users/users.mongo.repository'
import { AuthMongoRepository } from '../auth.mongo.repository'

@Injectable()
export class GenerateAccessAndRefreshTokensUseCase {
	constructor(
		private authRepository: AuthMongoRepository,
		private jwtService: JwtService,
		private usersRepository: UsersMongoRepository,
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
