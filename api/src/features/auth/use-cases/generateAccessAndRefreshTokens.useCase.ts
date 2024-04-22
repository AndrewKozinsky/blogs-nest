import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { UsersRepository } from '../../users/users.repository'
import { AuthRepository } from '../auth.repository'

@Injectable()
export class GenerateAccessAndRefreshTokensUseCase {
	constructor(
		private authRepository: AuthRepository,
		private jwtService: JwtService,
		private usersRepository: UsersRepository,
	) {}

	async execute(
		deviceRefreshTokenStr: string,
	): Promise<LayerResult<{ newAccessToken: string; newRefreshToken: string }>> {
		const deviceRefreshTokenObj =
			await this.authRepository.getDeviceRefreshTokenByTokenStr(deviceRefreshTokenStr)

		if (
			!deviceRefreshTokenObj ||
			!this.jwtService.isRefreshTokenStrValid(deviceRefreshTokenStr)
		) {
			return {
				code: LayerResultCode.Unauthorized,
			}
		}

		const user = await this.usersRepository.getUserById(deviceRefreshTokenObj.userId)

		if (!user) {
			return {
				code: LayerResultCode.Unauthorized,
			}
		}

		await this.authRepository.updateDeviceRefreshTokenDate(deviceRefreshTokenObj.deviceId)

		const newRefreshToken = this.jwtService.createRefreshTokenStr(
			deviceRefreshTokenObj.deviceId,
		)

		return {
			code: LayerResultCode.Success,
			data: {
				newAccessToken: this.jwtService.createAccessTokenStr(deviceRefreshTokenObj.userId),
				newRefreshToken,
			},
		}
	}
}
