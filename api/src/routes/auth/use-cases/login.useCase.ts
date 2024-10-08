import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { BrowserService } from '../../../base/application/browser.service'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { UserServiceModel } from '../../../models/users/users.service.model'
import { AuthRepository } from '../../../repositories/authRepository/auth.repository'
import { AuthLoginDtoModel } from '../../../models/auth/authLogin.input.model'

@Injectable()
export class LoginUseCase {
	constructor(
		private authRepository: AuthRepository,
		private jwtService: JwtService,
		private browserService: BrowserService,
	) {}

	async execute(
		req: Request,
		body: AuthLoginDtoModel,
	): Promise<LayerResult<{ refreshTokenStr: string; user: UserServiceModel }>> {
		const getUserRes = await this.authRepository.getConfirmedUserByLoginOrEmailAndPassword(body)

		if (getUserRes.code !== LayerSuccessCode.Success || !getUserRes.data) {
			return {
				code: LayerErrorCode.Unauthorized_401,
			}
		}

		const clientIP = this.browserService.getClientIP(req)
		const clientName = this.browserService.getClientName(req)

		const newDeviceRefreshToken = this.jwtService.createDeviceRefreshToken(
			getUserRes.data.id,
			clientIP,
			clientName,
		)

		await this.authRepository.insertDeviceRefreshToken(newDeviceRefreshToken)

		const refreshTokenStr = this.jwtService.createRefreshTokenStr(
			newDeviceRefreshToken.deviceId,
		)

		return {
			code: LayerSuccessCode.Success,
			data: {
				refreshTokenStr,
				user: getUserRes.data,
			},
		}
	}
}
