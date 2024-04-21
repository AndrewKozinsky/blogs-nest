import { Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CommonService } from '../../common/common.service'
import { CreateUserDtoModel } from '../models/users.input.model'
import { UsersQueryRepository } from '../users.queryRepository'
import { UsersRepository } from '../users.repository'

@Injectable()
export class CreateUserUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private commonService: CommonService,
		private usersQueryRepository: UsersQueryRepository,
	) {}

	async execute(data: CreateUserDtoModel): Promise<any> {
		const newUserDto = await this.commonService.getCreateUserDto(data, true)
		const createdUserId = await this.usersRepository.createUser(newUserDto)

		return await this.usersQueryRepository.getUser(createdUserId)
	}
}
