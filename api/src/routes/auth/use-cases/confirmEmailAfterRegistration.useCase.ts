import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { AuthRepository } from '../../../repositories/authRepository/auth.repository'

@Injectable()
export class ConfirmEmailAfterRegistrationUseCase {
	constructor(private authRepository: AuthRepository) {}

	async execute(confirmationCode: string): Promise<LayerResult<null>> {
		const user = await this.authRepository.getUserByConfirmationCode(confirmationCode)
		if (!user || user.emailConfirmation.isConfirmed) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		if (
			user.emailConfirmation.confirmationCode !== confirmationCode ||
			user.emailConfirmation.expirationDate < new Date()
		) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		await this.authRepository.makeUserEmailConfirmed(user.id)

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}
}
