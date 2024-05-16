import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { BrowserService } from '../../../base/application/browser.service'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { UserServiceModel } from '../../users/models/users.service.model'
import { AuthMongoRepository } from '../auth.mongo.repository'
import { AuthLoginDtoModel } from '../model/authLogin.input.model'

@Injectable()
export class LoginUseCase {
	constructor(
		private authMongoRepository: AuthMongoRepository,
		private jwtService: JwtService,
		private browserService: BrowserService,
	) {}

	async execute(
		req: Request,
		body: AuthLoginDtoModel,
	): Promise<LayerResult<{ refreshTokenStr: string; user: UserServiceModel }>> {
		const getUserRes =
			await this.authMongoRepository.getConfirmedUserByLoginOrEmailAndPassword(body)

		if (getUserRes.code !== LayerResultCode.Success || !getUserRes.data) {
			return {
				code: LayerResultCode.Unauthorized,
			}
		}

		const clientIP = this.browserService.getClientIP(req)
		const clientName = this.browserService.getClientName(req)

		const newDeviceRefreshToken = this.jwtService.createDeviceRefreshToken(
			getUserRes.data.id,
			clientIP,
			clientName,
		)
		await this.authMongoRepository.insertDeviceRefreshToken(newDeviceRefreshToken)

		const refreshTokenStr = this.jwtService.createRefreshTokenStr(
			newDeviceRefreshToken.deviceId,
		)

		return {
			code: LayerResultCode.Success,
			data: {
				refreshTokenStr,
				user: getUserRes.data,
			},
		}
	}
}
