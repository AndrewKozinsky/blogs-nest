import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BrowserService } from '../../../base/application/browser.service'
import { JwtService } from '../../../base/application/jwt.service'
import { RequestService } from '../../../base/application/request.service'
import { EmailManager } from '../../../base/managers/email.manager'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { CommonService } from '../../common/common.service'
import { UserServiceModel } from '../../users/models/users.service.model'
import { UsersRepository } from '../../users/users.repository'
import { UsersService } from '../../users/users.service'
import { AuthRepository } from '../auth.repository'
import { MeOutModel } from '../model/auth.output.model'
import { AuthRegistrationDtoModel } from '../model/authRegistration.input.model'
import { AuthRegistrationConfirmationDtoModel } from '../model/authRegistrationConfirmation.input.model'

export class LogoutCommand {
	constructor(public refreshTokenStr: string) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
	constructor(
		private authRepository: AuthRepository,
		private jwtService: JwtService,
	) {}

	async execute(command: LogoutCommand): Promise<LayerResult<null>> {
		const { refreshTokenStr } = command

		const refreshTokenInDb =
			await this.authRepository.getDeviceRefreshTokenByTokenStr(refreshTokenStr)

		if (!refreshTokenInDb || !this.jwtService.isRefreshTokenStrValid(refreshTokenStr)) {
			return { code: LayerResultCode.Unauthorized }
		}

		await this.authRepository.deleteDeviceRefreshTokenByDeviceId(refreshTokenInDb.deviceId)

		return { code: LayerResultCode.Success }
	}
}
