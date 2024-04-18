import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CommonService } from '../../common/common.service'
import { UsersQueryRepository } from '../users.queryRepository'
import { UsersRepository } from '../users.repository'

export class DeleteUserCommand {
	constructor(public userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
	constructor(private usersRepository: UsersRepository) {}

	async execute(command: DeleteUserCommand): Promise<any> {
		return this.usersRepository.deleteUser(command.userId)
	}
}
