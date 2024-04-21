import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { AuthRepository } from '../auth.repository'

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
			return { code: LayerResultCode.Unauthorized }
		}

		await this.authRepository.deleteDeviceRefreshTokenByDeviceId(refreshTokenInDb.deviceId)

		return { code: LayerResultCode.Success }
	}
}
