import { Injectable } from '@nestjs/common'
import { UserServiceModel } from '../../../models/users/users.service.model'
import { MeOutModel } from '../../../models/auth/auth.output.model'

@Injectable()
export class GetCurrentUserUseCase {
	constructor() {}

	async execute(user: UserServiceModel): Promise<MeOutModel> {
		return {
			userId: user.id,
			email: user.account.email,
			login: user.account.login,
		}
	}
}
