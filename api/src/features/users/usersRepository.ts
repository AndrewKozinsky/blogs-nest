import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { DBTypes } from '../../db/mongo/dbTypes'
import { PGGetUserQuery } from '../../db/pg/blogs'
import { convertToNumber } from '../../utils/numbers'
import { CommonService } from '../common/common.service'
import { User, UserDocument } from '../../db/mongo/schemas/user.schema'
import { UserServiceModel } from './models/users.service.model'

@Injectable()
export class UsersRepository {
	constructor(
		@InjectModel(User.name) private UserModel: Model<User>,
		private commonService: CommonService,
		private hashAdapter: HashAdapter,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getUserById(userId: string) {
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
	/*async getUserByIdByMongo(userId: string) {
		if (!ObjectId.isValid(userId)) {
			return null
		}

		const getUserRes = await this.UserModel.findOne({ _id: new ObjectId(userId) })

		if (!getUserRes) return null

		// @ts-ignore
		return this.mapDbUserToServiceUser(getUserRes)
	}*/

	async getUserByPasswordRecoveryCode(passwordRecoveryCode: string) {
		const usersRes = await this.dataSource.query(
			`SELECT * FROM users WHERE passwordRecoveryCode='${passwordRecoveryCode}'`,
			[],
		)

		if (!usersRes.length) {
			return null
		}

		return this.mapDbUserToServiceUser(usersRes[0])
	}

	/*async getUserByPasswordRecoveryCodeByMongo(passwordRecoveryCode: string) {
		const getUserRes = await this.UserModel.findOne({
			'account.passwordRecoveryCode': passwordRecoveryCode,
		})

		if (!getUserRes) return null

		return this.mapDbUserToServiceUser(getUserRes)
	}*/

	async createUser(dto: Omit<PGGetUserQuery, 'id'>) {
		return this.commonService.createUser(dto)
	}

	async deleteUser(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}

	mapDbUserToServiceUser(dbUser: PGGetUserQuery): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}

	async setPasswordRecoveryCodeToUser(userId: string, recoveryCode: null | string) {
		const updateUserRes = await this.dataSource.query(
			`UPDATE users SET passwordRecoveryCode = ${recoveryCode} WHERE id = ${userId};`,
			[],
		)
	}

	/*async setPasswordRecoveryCodeToUserByMongo(userId: string, recoveryCode: null | string) {
		await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'account.passwordRecoveryCode': recoveryCode } },
		)
	}*/

	async setNewPasswordToUser(userId: string, newPassword: string) {
		const passwordHash = await this.hashAdapter.hashString(newPassword)

		const updateUserRes = await this.dataSource.query(
			`UPDATE users SET password = ${passwordHash} WHERE id = ${userId};`,
			[],
		)
	}

	/*async setNewPasswordToUserByMongo(userId: string, newPassword: string) {
		const passwordHash = await this.hashAdapter.hashString(newPassword)

		await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'account.password': passwordHash } },
		)
	}*/
}
