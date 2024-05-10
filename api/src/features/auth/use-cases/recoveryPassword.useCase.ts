import { Injectable } from '@nestjs/common'
import { EmailManager } from '../../../base/managers/email.manager'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { createUniqString } from '../../../utils/stringUtils'
import { UsersMongoRepository } from '../../users/users.mongo.repository'
import { AuthMongoRepository } from '../auth.mongo.repository'

@Injectable()
export class RecoveryPasswordUseCase {
	constructor(
		private authRepository: AuthMongoRepository,
		private usersRepository: UsersMongoRepository,
		private emailManager: EmailManager,
	) {}

	async execute(email: string): Promise<LayerResult<null>> {
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
