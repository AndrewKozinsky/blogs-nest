import { Injectable } from '@nestjs/common'
import { UsersRepository } from './usersRepository'

@Injectable()
export class UsersService {
	constructor(private usersRepository: UsersRepository) {}

	async getUser(userId: string) {
		return this.usersRepository.getUserById(userId)
	}
}
