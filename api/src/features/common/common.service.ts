import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { DBTypes } from '../../db/mongo/dbTypes'
import { User, UserDocument } from '../../db/mongo/schemas/user.schema'
import { PGGetUserQuery } from '../../db/pg/blogs'
import { createUniqString } from '../../utils/stringUtils'
import { UserServiceModel } from '../users/models/users.service.model'
import { add } from 'date-fns'

@Injectable()
export class CommonService {
	constructor(
		@InjectModel(User.name) private UserModel: Model<User>,
		private hashAdapter: HashAdapter,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	// Return object which can be saved in DB to create a new user
	async getCreateUserDto(
		dto: { login: string; email: string; password: string },
		isEmailConfirmed: boolean,
	): Promise<Omit<PGGetUserQuery, 'id'>> {
		const passwordHash = await this.hashAdapter.hashString(dto.password)

		return {
			login: dto.login,
			email: dto.email,
			password: passwordHash,
			passwordRecoveryCode: undefined,
			createdAt: new Date().toISOString(),
			emailConfirmationCode: createUniqString(),
			confirmationCodeExpirationDate: add(new Date(), { hours: 0, minutes: 5 }).toISOString(),
			isConfirmationEmailCodeConfirmed: isEmailConfirmed,
		}
	}

	async createUser(dto: Omit<PGGetUserQuery, 'id'>) {
		// Insert new user and to get an array like this: [ { id: 10 } ]
		const newBlogsIdRes = await this.dataSource.query(
			`INSERT INTO blogs
			("login", "email", "password", "passwordRecoveryCode", "createdAt", "emailConfirmationCode", "confirmationCodeExpirationDate", "isConfirmationEmailCodeConfirmed")
			VALUES($1, $2, $3, $4, $5) RETURNING id`,
			[
				dto.login,
				dto.email,
				dto.password,
				dto.passwordRecoveryCode,
				dto.createdAt,
				dto.emailConfirmationCode,
				dto.confirmationCodeExpirationDate,
				dto.isConfirmationEmailCodeConfirmed,
			],
		)

		return newBlogsIdRes[0].id
	}

	/*async createUserByMongo(dto: DBTypes.User) {
		const userRes = await this.UserModel.create(dto)
		return userRes.id
	}*/

	async deleteUser(userId: string): Promise<boolean> {
		if (!ObjectId.isValid(userId)) {
			return false
		}

		const result = await this.UserModel.deleteOne({ _id: new ObjectId(userId) })

		return result.deletedCount === 1
	}

	mapDbUserToServiceUser(DbUser: PGGetUserQuery): UserServiceModel {
		return {
			id: DbUser.id,
			account: {
				login: DbUser.login,
				email: DbUser.email,
				password: DbUser.password,
				passwordRecoveryCode: DbUser.passwordRecoveryCode,
				createdAt: DbUser.createdAt,
			},
			emailConfirmation: {
				confirmationCode: DbUser.emailConfirmationCode,
				expirationDate: new Date(DbUser.confirmationCodeExpirationDate),
				isConfirmed: DbUser.isConfirmationEmailCodeConfirmed,
			},
		}
	}
}
