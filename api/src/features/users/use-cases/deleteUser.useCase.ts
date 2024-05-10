import { Injectable } from '@nestjs/common'
import { UsersMongoRepository } from '../users.mongo.repository'

@Injectable()
export class DeleteUserUseCase {
	constructor(private usersRepository: UsersMongoRepository) {}

	async execute(userId: string) {
		return this.usersRepository.deleteUser(userId)
	}
}
