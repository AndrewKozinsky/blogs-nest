import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { RequestService } from '../../../base/application/request.service'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { UsersRepository } from '../../users/users.repository'
import { AuthRepository } from '../auth.repository'

@Injectable()
export class GenerateAccessAndRefreshTokensUseCase {
	constructor(
		private authRepository: AuthRepository,
		private jwtService: JwtService,
		private requestService: RequestService,
		private usersRepository: UsersRepository,
	) {}

	async execute(
		deviceRefreshTokenStr: string,
	): Promise<LayerResult<{ newAccessToken: string; newRefreshToken: string }>> {
		const deviceRefreshTokenObj =
			await this.authRepository.getDeviceRefreshTokenByTokenStr(deviceRefreshTokenStr)
		console.log({ deviceRefreshTokenObj: deviceRefreshTokenObj })

		if (
			!deviceRefreshTokenObj ||
			!this.jwtService.isRefreshTokenStrValid(deviceRefreshTokenStr)
		) {
			return {
				code: LayerResultCode.Unauthorized,
			}
		}

		const user = await this.usersRepository.getUserById(deviceRefreshTokenObj.userId)
		console.log({ user })

		if (!user) {
			console.log('401')
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
