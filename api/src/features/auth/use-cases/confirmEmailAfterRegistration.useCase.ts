import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { AuthRepository } from '../authRepository'

@Injectable()
export class ConfirmEmailAfterRegistrationUseCase {
	constructor(private authRepository: AuthRepository) {}

	async execute(confirmationCode: string): Promise<LayerResult<null>> {
		const user = await this.authRepository.getUserByConfirmationCode(confirmationCode)
		if (!user || user.emailConfirmation.isConfirmed) {
			return {
				code: LayerErrorCode.BadRequest,
			}
		}

		if (
			user.emailConfirmation.confirmationCode !== confirmationCode ||
			user.emailConfirmation.expirationDate < new Date()
		) {
			return {
				code: LayerErrorCode.BadRequest,
			}
		}

		await this.authRepository.makeUserEmailConfirmed(user.id)

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}
}
