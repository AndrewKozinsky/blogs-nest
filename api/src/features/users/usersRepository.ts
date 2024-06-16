import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { PGGetUserQuery } from '../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../utils/numbers'
import { CommonService } from '../common/common.service'
import { User } from '../../db/mongo/schemas/user.schema'
import { UserServiceModel } from './models/users.service.model'

@Injectable()
export class UsersRepository {
	constructor(
		private commonService: CommonService,
		private hashAdapter: HashAdapter,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getUserById(userId: string) {
		// ПЕРЕПИСАТЬ на TYPEORM!!!
		const userIdNum = convertToNumber(userId)
		if (!userIdNum) {
			return false
		}

		const usersRes = await this.dataSource.query(`SELECT * FROM users WHERE id=${userId}`, [])

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
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
		// ПЕРЕПИСАТЬ на TYPEORM!!!
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE passwordRecoveryCode='${passwordRecoveryCode}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
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
		// return this.commonService.deleteUser(userId)

		// --
		// @ts-ignore
		return null
	}

	/*async deleteUserNative(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}*/

	mapDbUserToServiceUser(dbUser: PGGetUserQuery): UserServiceModel {
		// return this.commonService.mapDbUserToServiceUser(dbUser)

		// --
		// @ts-ignore
		return null
	}

	/*mapDbUserToServiceUserNative(dbUser: PGGetUserQuery): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}*/

	async setPasswordRecoveryCodeToUser(userId: string, recoveryCode: null | string) {
		/*const updateUserRes = await this.dataSource.query(
			'UPDATE users SET passwordRecoveryCode = $1 WHERE id = $2;',
			[recoveryCode, userId],
		)*/

		// --
		// @ts-ignore
		return null
	}

	/*async setPasswordRecoveryCodeToUserNative(userId: string, recoveryCode: null | string) {
		const updateUserRes = await this.dataSource.query(
			'UPDATE users SET passwordRecoveryCode = $1 WHERE id = $2;',
			[recoveryCode, userId],
		)
	}*/

	async setNewPasswordToUser(userId: string, newPassword: string) {
		// const passwordHash = await this.hashAdapter.hashString(newPassword)

		/*const updateUserRes = await this.dataSource.query(
			'UPDATE users SET password = $1 WHERE id = $2',
			[passwordHash, userId],
		)*/

		// --
		// @ts-ignore
		return null
	}

	/*async setNewPasswordToUserNative(userId: string, newPassword: string) {
		const passwordHash = await this.hashAdapter.hashString(newPassword)

		const updateUserRes = await this.dataSource.query(
			'UPDATE users SET password = $1 WHERE id = $2',
			[passwordHash, userId],
		)
	}*/
}
