import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { User } from '../../db/pg/entities/user'
import { PGGetUserQuery } from '../../db/pg/getPgDataTypes'
import { CommonService } from '../common/common.service'
import { UserServiceModel } from './models/users.service.model'

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

	/*async getUserByIdNative(userId: string) {
		const userIdNum = convertToNumber(userId)
		if (!userIdNum) {
			return false
		}

		const usersRes = await this.dataSource.query(`SELECT * FROM users WHERE id=${userId}`, [])

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}*/

	async getUserByPasswordRecoveryCode(passwordRecoveryCode: string) {
		const user = await this.dataSource
			.getRepository(User)
			.findOneBy({ passwordRecoveryCode: passwordRecoveryCode })

		if (!user) return null

		return this.mapDbUserToServiceUser(user)
	}

	/*async getUserByPasswordRecoveryCodeNative(passwordRecoveryCode: string) {
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE passwordRecoveryCode='${passwordRecoveryCode}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}*/

	async createUser(dto: Omit<PGGetUserQuery, 'id'>) {
		return this.commonService.createUser(dto)
	}
	async deleteUser(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}

	/*async deleteUserNative(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}*/

	mapDbUserToServiceUser(dbUser: User): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}

	/*mapDbUserToServiceUserNative(dbUser: PGGetUserQuery): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}*/

	async setPasswordRecoveryCodeToUser(userId: string, recoveryCode: null | string) {
		const res = await this.dataSource.getRepository(User).update(userId, {
			passwordRecoveryCode: recoveryCode,
		})
	}

	/*async setPasswordRecoveryCodeToUserNative(userId: string, recoveryCode: null | string) {
		const updateUserRes = await this.dataSource.query(
			'UPDATE users SET passwordRecoveryCode = $1 WHERE id = $2;',
			[recoveryCode, userId],
		)
	}*/

	async setNewPasswordToUser(userId: string, newPassword: string) {
		const passwordHash = await this.hashAdapter.hashString(newPassword)

		await this.dataSource.getRepository(User).update(userId, { password: passwordHash })
	}

	/*async setNewPasswordToUserNative(userId: string, newPassword: string) {
		const passwordHash = await this.hashAdapter.hashString(newPassword)

		const updateUserRes = await this.dataSource.query(
			'UPDATE users SET password = $1 WHERE id = $2',
			[passwordHash, userId],
		)
	}*/
}
