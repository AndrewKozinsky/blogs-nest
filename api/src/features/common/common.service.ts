import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { DBTypes } from '../../db/dbTypes'
import { User, UserDocument } from '../../db/schemas/user.schema'
import { createUniqString } from '../../utils/stringUtils'
import { UserServiceModel } from '../users/models/users.service.model'
import { add } from 'date-fns'

@Injectable()
export class CommonService {
	constructor(
		@InjectModel(User.name) private UserModel: Model<User>,
		private hashAdapter: HashAdapter,
	) {}

	// Return object which can be saved in DB to create a new user
	async getCreateUserDto(
		dto: { login: string; email: string; password: string },
		isEmailConfirmed: boolean,
	): Promise<DBTypes.User> {
		const passwordHash = await this.hashAdapter.hashString(dto.password)

		return {
			account: {
				login: dto.login,
				email: dto.email,
				password: passwordHash,
				passwordRecoveryCode: undefined,
				createdAt: new Date().toISOString(),
			},
			emailConfirmation: {
				confirmationCode: createUniqString(),
				expirationDate: add(new Date(), { hours: 0, minutes: 5 }),
				isConfirmed: isEmailConfirmed,
			},
		}
	}

	async createUser(dto: DBTypes.User) {
		const userRes = await this.UserModel.create(dto)
		return userRes.id
	}

	async deleteUser(userId: string): Promise<boolean> {
		if (!ObjectId.isValid(userId)) {
			return false
		}

		const result = await this.UserModel.deleteOne({ _id: new ObjectId(userId) })

		return result.deletedCount === 1
	}

	mapDbUserToServiceUser(DbUser: UserDocument): UserServiceModel {
		return {
			id: DbUser._id.toString(),
			account: {
				login: DbUser.account.login,
				email: DbUser.account.email,
				password: DbUser.account.password,
				passwordRecoveryCode: DbUser.account.passwordRecoveryCode,
				createdAt: DbUser.account.createdAt,
			},
			emailConfirmation: {
				confirmationCode: DbUser.emailConfirmation.confirmationCode,
				expirationDate: DbUser.emailConfirmation.expirationDate,
				isConfirmed: DbUser.emailConfirmation.isConfirmed,
			},
		}
	}
}
