import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { EmailManager } from '../../../base/managers/email.manager'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { CommonService } from '../../common/common.service'
import { UserServiceModel } from '../../users/models/users.service.model'
import { UsersService } from '../../users/users.service'
import { AuthRepository } from '../auth.repository'
import { MeOutModel } from '../model/auth.output.model'
import { AuthRegistrationDtoModel } from '../model/authRegistration.input.model'
import { AuthRegistrationConfirmationDtoModel } from '../model/authRegistrationConfirmation.input.model'

export class GetCurrentUserCommand {
	constructor(public user: UserServiceModel) {}
}

@CommandHandler(GetCurrentUserCommand)
export class GetCurrentUserUseCase implements ICommandHandler<GetCurrentUserCommand> {
	constructor() {}

	async execute(command: GetCurrentUserCommand): Promise<MeOutModel> {
		const { user } = command

		return {
			userId: user.id,
			email: user.account.email,
			login: user.account.login,
		}
	}
}
