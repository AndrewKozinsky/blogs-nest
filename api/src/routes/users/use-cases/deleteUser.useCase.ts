import { Injectable } from '@nestjs/common'
import { UsersRepository } from '../../../repositories/users.repository'

@Injectable()
export class DeleteUserUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute(userId: string) {
		return this.usersRepository.deleteUser(userId)
	}
}
