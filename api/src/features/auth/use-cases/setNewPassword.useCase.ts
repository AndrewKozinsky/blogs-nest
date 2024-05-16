import { Injectable } from '@nestjs/common'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { UsersMongoRepository } from '../../users/users.mongo.repository'

@Injectable()
export class SetNewPasswordUseCase {
	constructor(private usersMongoRepository: UsersMongoRepository) {}

	async execute(passRecoveryCode: string, newPassword: string): Promise<LayerResult<null>> {
		const user = await this.usersMongoRepository.getUserByPasswordRecoveryCode(passRecoveryCode)

		if (!user) {
			return { code: LayerResultCode.BadRequest }
		}

		await this.usersMongoRepository.setPasswordRecoveryCodeToUser(user.id, null)

		await this.usersMongoRepository.setNewPasswordToUser(user.id, newPassword)

		return {
			code: LayerResultCode.Success,
		}
	}
}
