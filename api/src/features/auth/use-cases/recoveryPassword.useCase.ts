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

export class RecoveryPasswordCommand {
	constructor(public email: string) {}
}

@CommandHandler(RecoveryPasswordCommand)
export class RecoveryPasswordUseCase implements ICommandHandler<RecoveryPasswordCommand> {
	constructor(
		private authRepository: AuthRepository,
		private usersRepository: UsersRepository,
		private emailManager: EmailManager,
	) {}

	async execute(command: RecoveryPasswordCommand): Promise<LayerResult<null>> {
		const { email } = command

		const user = await this.authRepository.getUserByLoginOrEmail(email)

		// Send success status even if current email is not registered (for prevent user's email detection)
		if (!user) {
			return { code: LayerResultCode.Success }
		}

		const recoveryCode = createUniqString()

		await this.usersRepository.setPasswordRecoveryCodeToUser(user.id, recoveryCode)

		try {
			await this.emailManager.sendPasswordRecoveryMessage(email, recoveryCode)

			return {
				code: LayerResultCode.Success,
			}
		} catch (err: unknown) {
			console.log(err)
			await this.authRepository.deleteUser(user.id)

			return {
				code: LayerResultCode.BadRequest,
			}
		}
	}
}
