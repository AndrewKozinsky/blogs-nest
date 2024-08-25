import { Injectable } from '@nestjs/common'
import { JwtService } from '../../../base/application/jwt.service'
import { SecurityRepository } from '../../../repositories/security.repository'

@Injectable()
export class TerminateAllDeviceRefreshTokensApartThisUseCase {
	constructor(
		private jwtService: JwtService,
		private securityRepository: SecurityRepository,
	) {}

	async execute(refreshTokenStr: string) {
		const refreshToken = this.jwtService.getRefreshTokenDataFromTokenStr(refreshTokenStr)
		const { deviceId } = refreshToken!

		await this.securityRepository.terminateAllDeviceRefreshTokensApartThis(deviceId)
	}
}
