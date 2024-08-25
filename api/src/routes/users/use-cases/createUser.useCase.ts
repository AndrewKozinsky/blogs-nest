import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { AuthRepository } from '../../../repositories/authRepository/auth.repository'
import { CommonService } from '../../common/common.service'
import { CreateUserDtoModel } from '../../../models/users/users.input.model'
import { UserOutModel } from '../../../models/users/users.output.model'
import { UsersQueryRepository } from '../../../repositories/users.queryRepository'
import { UsersRepository } from '../../../repositories/users.repository'

@Injectable()
export class CreateUserUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private commonService: CommonService,
		private usersQueryRepository: UsersQueryRepository,
		private authRepository: AuthRepository,
	) {}

	async execute(data: CreateUserDtoModel): Promise<LayerResult<UserOutModel>> {
		const userByEmail = await this.authRepository.getUserByEmail(data.email)

		if (userByEmail) {
			return { code: LayerErrorCode.BadRequest_400 }
		}

		const newUserDto = await this.commonService.getCreateUserDto(data, true)
		const createdUserId = await this.usersRepository.createUser(newUserDto)

		const createdUser = await this.usersQueryRepository.getUser(createdUserId)

		if (!createdUser) {
			return { code: LayerErrorCode.BadRequest_400 }
		}

		return {
			code: LayerSuccessCode.Success,
			data: createdUser,
		}
	}
}
