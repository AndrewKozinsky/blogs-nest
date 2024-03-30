import { Injectable } from '@nestjs/common'
import { CommonService } from '../common/common.service'
import { CreateUserDtoModel } from './models/users.input.model'
import { UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
	constructor(
		private usersRepository: UsersRepository,
		private commonService: CommonService,
	) {}

	async getUser(userId: string) {
		return this.usersRepository.getUserById(userId)
	}

	async createUserByAdmin(dto: CreateUserDtoModel) {
		const newUserDto = await this.commonService.getCreateUserDto(dto, true)
		return this.usersRepository.createUser(newUserDto)
	}

	async deleteUser(userId: string): Promise<boolean> {
		return this.usersRepository.deleteUser(userId)
	}
}
