import { Injectable } from '@nestjs/common'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { AuthMongoRepository } from '../../auth/auth.mongo.repository'
import { CommonService } from '../../common/common.service'
import { CreateUserDtoModel } from '../models/users.input.model'
import { UserOutModel } from '../models/users.output.model'
import { UsersMongoQueryRepository } from '../users.mongo.queryRepository'
import { UsersMongoRepository } from '../users.mongo.repository'

@Injectable()
export class CreateUserUseCase {
	constructor(
		private usersRepository: UsersMongoRepository,
		private commonService: CommonService,
		private usersQueryRepository: UsersMongoQueryRepository,
		private authRepository: AuthMongoRepository,
	) {}

	async execute(data: CreateUserDtoModel): Promise<LayerResult<UserOutModel>> {
		const userByEmail = await this.authRepository.getUserByEmail(data.email)
		if (userByEmail) {
			return { code: LayerResultCode.BadRequest }
		}

		const newUserDto = await this.commonService.getCreateUserDto(data, true)
		const createdUserId = await this.usersRepository.createUser(newUserDto)

		const createdUser = await this.usersQueryRepository.getUser(createdUserId)
		if (!createdUser) {
			return { code: LayerResultCode.BadRequest }
		}

		return {
			code: LayerResultCode.Success,
			data: createdUser,
		}
	}
}
