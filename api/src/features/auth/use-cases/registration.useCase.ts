import { Injectable } from '@nestjs/common'
import { EmailManager } from '../../../base/managers/email.manager'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { CommonService } from '../../common/common.service'
import { UsersService } from '../../users/users.service'
import { AuthMongoRepository } from '../auth.mongo.repository'
import { AuthRegistrationDtoModel } from '../model/authRegistration.input.model'

@Injectable()
export class RegistrationUseCase {
	constructor(
		private authRepository: AuthMongoRepository,
		private commonService: CommonService,
		private usersService: UsersService,
		private emailManager: EmailManager,
	) {}

	async execute(dto: AuthRegistrationDtoModel): Promise<LayerResult<null>> {
		const userByEmail = await this.authRepository.getUserByLoginOrEmail(dto.email)
		if (userByEmail) {
			return { code: LayerResultCode.BadRequest }
		}

		const newUserDto = await this.commonService.getCreateUserDto(dto, false)

		const userId = await this.authRepository.createUser(newUserDto)

		const user = await this.usersService.getUser(userId)
		if (!user) {
			return { code: LayerResultCode.BadRequest }
		}

		try {
			await this.emailManager.sendEmailConfirmationMessage(
				user.account.email,
				user.emailConfirmation.confirmationCode,
			)

			return {
				code: LayerResultCode.Success,
			}
		} catch (err: unknown) {
			console.log(err)
			await this.authRepository.deleteUser(userId)

			return {
				code: LayerResultCode.BadRequest,
			}
		}
	}
}
