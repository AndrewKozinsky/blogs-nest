import { Injectable } from '@nestjs/common'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { UsersRepository } from '../../users/users.repository'

@Injectable()
export class SetNewPasswordUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute(passRecoveryCode: string, newPassword: string): Promise<LayerResult<null>> {
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
