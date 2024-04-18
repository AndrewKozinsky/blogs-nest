import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BrowserService } from '../../../base/application/browser.service'
import { JwtService } from '../../../base/application/jwt.service'
import { RequestService } from '../../../base/application/request.service'
import { EmailManager } from '../../../base/managers/email.manager'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { createUniqString } from '../../../utils/stringUtils'
import { CommonService } from '../../common/common.service'
import { UserServiceModel } from '../../users/models/users.service.model'
import { UsersRepository } from '../../users/users.repository'
import { UsersService } from '../../users/users.service'
import { AuthRepository } from '../auth.repository'
import { MeOutModel } from '../model/auth.output.model'
import { AuthRegistrationDtoModel } from '../model/authRegistration.input.model'
import { AuthRegistrationConfirmationDtoModel } from '../model/authRegistrationConfirmation.input.model'

export class SetNewPasswordCommand {
	constructor(
		public passRecoveryCode: string,
		public newPassword: string,
	) {}
}

@CommandHandler(SetNewPasswordCommand)
export class SetNewPasswordUseCase implements ICommandHandler<SetNewPasswordCommand> {
	constructor(private usersRepository: UsersRepository) {}

	async execute(command: SetNewPasswordCommand): Promise<LayerResult<null>> {
		const { passRecoveryCode, newPassword } = command

		const user = await this.usersRepository.getUserByPasswordRecoveryCode(passRecoveryCode)

		if (!user) {
			return { code: LayerResultCode.BadRequest }
		}

		await this.usersRepository.setPasswordRecoveryCodeToUser(user.id, null)

		await this.usersRepository.setNewPasswordToUser(user.id, newPassword)

		return {
			code: LayerResultCode.Success,
		}
	}
}
