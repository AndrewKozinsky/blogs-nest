import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { UsersRepository } from '../../users/usersRepository'

@Injectable()
export class SetNewPasswordUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute(passRecoveryCode: string, newPassword: string): Promise<LayerResult<null>> {
		const user = await this.usersRepository.getUserByPasswordRecoveryCode(passRecoveryCode)

		if (!user) {
			return { code: LayerErrorCode.BadRequest_400 }
		}

		await this.usersRepository.setPasswordRecoveryCodeToUser(user.id, null)

		await this.usersRepository.setNewPasswordToUser(user.id, newPassword)

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}
}
