import { Injectable } from '@nestjs/common'
import { UserServiceModel } from '../../users/models/users.service.model'
import { MeOutModel } from '../model/auth.output.model'

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
