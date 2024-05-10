import { Injectable } from '@nestjs/common'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { AuthMongoRepository } from '../auth.mongo.repository'

@Injectable()
export class ConfirmEmailAfterRegistrationUseCase {
	constructor(private authRepository: AuthMongoRepository) {}

	async execute(confirmationCode: string): Promise<LayerResult<null>> {
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
