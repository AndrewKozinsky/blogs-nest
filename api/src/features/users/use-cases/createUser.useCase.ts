import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CommonService } from '../../common/common.service'
import { CreateUserDtoModel } from '../models/users.input.model'
import { UsersQueryRepository } from '../users.queryRepository'
import { UsersRepository } from '../users.repository'

export class CreateUserCommand {
	constructor(public data: CreateUserDtoModel) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
	constructor(
		private usersRepository: UsersRepository,
		private commonService: CommonService,
		private usersQueryRepository: UsersQueryRepository,
	) {}

	async execute(command: CreateUserCommand): Promise<any> {
		const newUserDto = await this.commonService.getCreateUserDto(command.data, true)
		const createdUserId = await this.usersRepository.createUser(newUserDto)

		return await this.usersQueryRepository.getUser(createdUserId)
	}
}
