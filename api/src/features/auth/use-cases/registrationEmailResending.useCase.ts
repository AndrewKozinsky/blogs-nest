import { Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { EmailManager } from '../../../base/managers/email.manager'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { AuthRepository } from '../auth.repository'
import { AuthRegistrationEmailResendingDtoModel } from '../model/authRegistrationEmailResending.input.model'

@Injectable()
export class RegistrationEmailResendingUseCase {
	constructor(
		private authRepository: AuthRepository,
		private emailManager: EmailManager,
	) {}

	async execute(body: AuthRegistrationEmailResendingDtoModel): Promise<LayerResult<null>> {
		const { email } = body

		const user = await this.authRepository.getUserByEmail(email)

		if (!user || user.emailConfirmation.isConfirmed) {
			return {
				code: LayerResultCode.BadRequest,
			}
		}

		const newConfirmationCode = await this.authRepository.setNewEmailConfirmationCode(user.id)

		// await не нужен потому что тест не проходит в Инкубаторе
		try {
			this.emailManager.sendEmailConfirmationMessage(email, newConfirmationCode)
		} catch (err: unknown) {
			console.log(err)

			return {
				code: LayerResultCode.BadRequest,
			}
		}

		return {
			code: LayerResultCode.Success,
		}
	}
}
