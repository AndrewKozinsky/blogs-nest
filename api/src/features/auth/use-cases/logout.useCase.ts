import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { AuthMongoRepository } from '../auth.mongo.repository'

@Injectable()
export class LogoutUseCase {
	constructor(
		private authMongoRepository: AuthMongoRepository,
		private jwtService: JwtService,
	) {}

	async execute(refreshTokenStr: string): Promise<LayerResult<null>> {
		const refreshTokenInDb =
			await this.authMongoRepository.getDeviceRefreshTokenByTokenStr(refreshTokenStr)

		if (!refreshTokenInDb || !this.jwtService.isRefreshTokenStrValid(refreshTokenStr)) {
			return { code: LayerResultCode.Unauthorized }
		}

		await this.authMongoRepository.deleteDeviceRefreshTokenByDeviceId(refreshTokenInDb.deviceId)

		return { code: LayerResultCode.Success }
	}
}
