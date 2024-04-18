import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { EmailManager } from '../../../base/managers/email.manager'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { CommonService } from '../../common/common.service'
import { UsersService } from '../../users/users.service'
import { AuthRepository } from '../auth.repository'
import { AuthRegistrationDtoModel } from '../model/authRegistration.input.model'
import { AuthRegistrationConfirmationDtoModel } from '../model/authRegistrationConfirmation.input.model'

export class ConfirmEmailAfterRegistrationCommand {
	constructor(public confirmationCode: string) {}
}

@CommandHandler(ConfirmEmailAfterRegistrationCommand)
export class ConfirmEmailAfterRegistrationUseCase
	implements ICommandHandler<ConfirmEmailAfterRegistrationCommand>
{
	constructor(private authRepository: AuthRepository) {}

	async execute(command: ConfirmEmailAfterRegistrationCommand): Promise<LayerResult<null>> {
		const { confirmationCode } = command

		const user = await this.authRepository.getUserByConfirmationCode(confirmationCode)
		if (!user || user.emailConfirmation.isConfirmed) {
			return {
				code: LayerResultCode.BadRequest,
			}
		}

		if (
			user.emailConfirmation.confirmationCode !== confirmationCode ||
			user.emailConfirmation.expirationDate < new Date()
		) {
			return {
				code: LayerResultCode.BadRequest,
			}
		}

		await this.authRepository.makeUserEmailConfirmed(user.id)

		return {
			code: LayerResultCode.Success,
		}
	}
}
