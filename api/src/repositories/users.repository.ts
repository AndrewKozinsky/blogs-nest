import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { HashAdapter } from '../base/adapters/hash.adapter'
import { User } from '../db/pg/entities/user'
import { PGGetUserQuery } from '../db/pg/getPgDataTypes'
import { CommonService } from '../routes/common/common.service'
import { UserServiceModel } from '../models/users/users.service.model'

@Injectable()
export class UsersRepository {
	constructor(
		private commonService: CommonService,
		private hashAdapter: HashAdapter,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getUserById(userId: string) {
		const user = await this.dataSource.getRepository(User).findOneBy({ id: userId })

		if (!user) {
			return null
		}

		return this.mapDbUserToServiceUser(user)
	}

	async getUserByPasswordRecoveryCode(passwordRecoveryCode: string) {
		const user = await this.dataSource
			.getRepository(User)
			.findOneBy({ passwordRecoveryCode: passwordRecoveryCode })

		if (!user) return null

		return this.mapDbUserToServiceUser(user)
	}

	async createUser(dto: Omit<PGGetUserQuery, 'id'>) {
		return this.commonService.createUser(dto)
	}
	async deleteUser(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}

	mapDbUserToServiceUser(dbUser: User): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}

	async setPasswordRecoveryCodeToUser(userId: string, recoveryCode: null | string) {
		const res = await this.dataSource.getRepository(User).update(userId, {
			passwordRecoveryCode: recoveryCode,
		})
	}

	async setNewPasswordToUser(userId: string, newPassword: string) {
		const passwordHash = await this.hashAdapter.hashString(newPassword)

		await this.dataSource.getRepository(User).update(userId, { password: passwordHash })
	}
}
