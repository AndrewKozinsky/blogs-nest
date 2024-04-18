import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Request } from 'express'
import { JwtService } from '../../../base/application/jwt.service'
import { RequestService } from '../../../base/application/request.service'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { UsersRepository } from '../../users/users.repository'
import { AuthRepository } from '../auth.repository'

export class GenerateAccessAndRefreshTokensCommand {
	constructor(public req: Request) {}
}

@CommandHandler(GenerateAccessAndRefreshTokensCommand)
export class GenerateAccessAndRefreshTokensUseCase
	implements ICommandHandler<GenerateAccessAndRefreshTokensCommand>
{
	constructor(
		private authRepository: AuthRepository,
		private jwtService: JwtService,
		private requestService: RequestService,
		private usersRepository: UsersRepository,
	) {}

	async execute(
		command: GenerateAccessAndRefreshTokensCommand,
	): Promise<LayerResult<{ newAccessToken: string; newRefreshToken: string }>> {
		const { req } = command

		const deviceRefreshTokenStr = this.requestService.getDeviceRefreshStrTokenFromReq(req)

		const deviceRefreshToken =
			await this.authRepository.getDeviceRefreshTokenByTokenStr(deviceRefreshTokenStr)

		if (!deviceRefreshToken || !this.jwtService.isRefreshTokenStrValid(deviceRefreshTokenStr)) {
			return {
				code: LayerResultCode.Unauthorized,
			}
		}

		const userRes = await this.usersRepository.getUserById(deviceRefreshToken.userId)

		if (!userRes) {
			return {
				code: LayerResultCode.Unauthorized,
			}
		}

		await this.authRepository.updateDeviceRefreshTokenDate(deviceRefreshToken.deviceId)

		const newRefreshToken = this.jwtService.createRefreshTokenStr(deviceRefreshToken.deviceId)

		return {
			code: LayerResultCode.Success,
			data: {
				newAccessToken: this.jwtService.createAccessTokenStr(deviceRefreshToken.userId),
				newRefreshToken,
			},
		}
	}
}