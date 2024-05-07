import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '../../base/application/jwt.service'
import { RequestService } from '../../base/application/request.service'
import { AuthRepository } from '../../features/auth/auth.repository'

@Injectable()
export class CheckDeviceRefreshTokenGuard implements CanActivate {
	constructor(
		private requestService: RequestService,
		private jwtService: JwtService,
		private readonly authRepository: AuthRepository,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()

		try {
			const refreshTokenStr = this.requestService.getRefreshTokenStrFromReq(request)

			if (!refreshTokenStr || !this.jwtService.isRefreshTokenStrValid(refreshTokenStr)) {
				throw new UnauthorizedException()
			}

			// Check if refreshTokenStr has another expiration date
			const refreshTokenStrExpirationDate =
				this.jwtService.getTokenStrExpirationDate(refreshTokenStr)

			const deviceRefreshToken =
				await this.authRepository.getDeviceRefreshTokenByTokenStr(refreshTokenStr)

			if (!refreshTokenStrExpirationDate || !deviceRefreshToken) {
				throw new UnauthorizedException()
			}

			if (
				refreshTokenStrExpirationDate!.toLocaleString() ===
				deviceRefreshToken!.expirationDate.toLocaleString()
			) {
				request.deviceRefreshToken = deviceRefreshToken

				return true
			}

			throw new UnauthorizedException()
		} catch (err: unknown) {
			throw new UnauthorizedException()
		}
	}
}
