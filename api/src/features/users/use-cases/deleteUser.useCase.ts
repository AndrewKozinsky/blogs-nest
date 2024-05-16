import { Injectable } from '@nestjs/common'
import { UsersMongoRepository } from '../users.mongo.repository'

@Injectable()
export class DeleteUserUseCase {
	constructor(private usersMongoRepository: UsersMongoRepository) {}

	async execute(userId: string) {
		return this.usersMongoRepository.deleteUser(userId)
	}
}
