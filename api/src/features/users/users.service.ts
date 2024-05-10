import { Injectable } from '@nestjs/common'
import { UsersMongoRepository } from './users.mongo.repository'

@Injectable()
export class UsersService {
	constructor(private usersRepository: UsersMongoRepository) {}

	async getUser(userId: string) {
		return this.usersRepository.getUserById(userId)
	}
}
