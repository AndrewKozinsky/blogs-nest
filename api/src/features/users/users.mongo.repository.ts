import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { DBTypes } from '../../db/mongo/dbTypes'
import { CommonService } from '../common/common.service'
import { User, UserDocument } from '../../db/mongo/schemas/user.schema'
import { UserServiceModel } from './models/users.service.model'

@Injectable()
export class UsersMongoRepository {
	constructor(
		@InjectModel(User.name) private UserModel: Model<User>,
		private commonService: CommonService,
		private hashAdapter: HashAdapter,
	) {}

	async getUserById(userId: string) {
		if (!ObjectId.isValid(userId)) {
			return null
		}

		const getUserRes = await this.UserModel.findOne({ _id: new ObjectId(userId) })

		if (!getUserRes) return null

		return this.mapDbUserToServiceUser(getUserRes)
	}

	async getUserByPasswordRecoveryCode(passwordRecoveryCode: string) {
		const getUserRes = await this.UserModel.findOne({
			'account.passwordRecoveryCode': passwordRecoveryCode,
		})

		if (!getUserRes) return null

		return this.mapDbUserToServiceUser(getUserRes)
	}

	async createUser(dto: DBTypes.User) {
		return this.commonService.createUser(dto)
	}

	async deleteUser(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}

	mapDbUserToServiceUser(dbUser: UserDocument): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}

	async setPasswordRecoveryCodeToUser(userId: string, recoveryCode: null | string) {
		await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'account.passwordRecoveryCode': recoveryCode } },
		)
	}

	async setNewPasswordToUser(userId: string, newPassword: string) {
		const passwordHash = await this.hashAdapter.hashString(newPassword)

		await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'account.password': passwordHash } },
		)
	}
}
