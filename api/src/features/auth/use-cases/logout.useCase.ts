import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { AuthRepository } from '../authRepository'

@Injectable()
export class LogoutUseCase {
	constructor(
		private authRepository: AuthRepository,
		private jwtService: JwtService,
	) {}

	async execute(refreshTokenStr: string): Promise<LayerResult<null>> {
		const refreshTokenInDb =
			await this.authRepository.getDeviceRefreshTokenByTokenStr(refreshTokenStr)

		if (!refreshTokenInDb || !this.jwtService.isRefreshTokenStrValid(refreshTokenStr)) {
			return { code: LayerErrorCode.Unauthorized_401 }
		}

		await this.authRepository.deleteDeviceRefreshTokenByDeviceId(refreshTokenInDb.deviceId)

		return { code: LayerSuccessCode.Success, data: null }
	}
}
