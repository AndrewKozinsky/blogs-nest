import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Request } from 'express'
import { BrowserService } from '../../../base/application/browser.service'
import { JwtService } from '../../../base/application/jwt.service'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { UserServiceModel } from '../../users/models/users.service.model'
import { AuthRepository } from '../auth.repository'
import { AuthLoginDtoModel } from '../model/authLogin.input.model'

export class LoginCommand {
	constructor(
		public req: Request,
		public body: AuthLoginDtoModel,
	) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
	constructor(
		private authRepository: AuthRepository,
		private jwtService: JwtService,
		private browserService: BrowserService,
	) {}

	async execute(
		command: LoginCommand,
	): Promise<LayerResult<{ refreshTokenStr: string; user: UserServiceModel }>> {
		const { req, body } = command

		const getUserRes = await this.authRepository.getConfirmedUserByLoginOrEmailAndPassword(body)

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
		await this.authRepository.insertDeviceRefreshToken(newDeviceRefreshToken)

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
