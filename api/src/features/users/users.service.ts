import { Injectable } from '@nestjs/common'
import { UsersMongoRepository } from './users.mongo.repository'

@Injectable()
export class UsersService {
	constructor(private usersMongoRepository: UsersMongoRepository) {}

	async getUser(userId: string) {
		return this.usersMongoRepository.getUserById(userId)
	}
}
