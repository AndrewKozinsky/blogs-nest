import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { DBTypes } from '../../db/mongo/dbTypes'
import { User, UserDocument } from '../../db/mongo/schemas/user.schema'
import { PGGetUserQuery } from '../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../utils/numbers'
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
			passwordrecoverycode: undefined,
			createdat: new Date().toISOString(),
			emailconfirmationcode: createUniqString(),
			confirmationcodeexpirationdate: add(new Date(), { hours: 0, minutes: 5 }).toISOString(),
			isconfirmationemailcodeconfirmed: isEmailConfirmed,
		}
	}

	async createUser(dto: Omit<PGGetUserQuery, 'id'>) {
		// Insert new user and to get an array like this: [ { id: 10 } ]
		const newBlogsIdRes = await this.dataSource.query(
			`INSERT INTO users
			("login", "email", "password", "passwordrecoverycode", "createdat", "emailconfirmationcode", "confirmationcodeexpirationdate", "isconfirmationemailcodeconfirmed")
			VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
			[
				dto.login,
				dto.email,
				dto.password,
				dto.passwordrecoverycode,
				dto.createdat,
				dto.emailconfirmationcode,
				dto.confirmationcodeexpirationdate,
				dto.isconfirmationemailcodeconfirmed,
			],
		)

		return newBlogsIdRes[0].id
	}

	/*async createUserByMongo(dto: DBTypes.User) {
		const userRes = await this.UserModel.create(dto)
		return userRes.id
	}*/

	async deleteUser(userId: string): Promise<boolean> {
		const userIdNum = convertToNumber(userId)
		if (!userIdNum) {
			return false
		}

		// The query will return an array where the second element is a number of deleted documents
		// [ [], 1 ]
		const deleteBlogRes = await this.dataSource.query(
			`DELETE FROM users WHERE id='${userId}'`,
			[],
		)

		return deleteBlogRes[1] === 1
	}

	/*async deleteUserByMongo(userId: string): Promise<boolean> {
		if (!ObjectId.isValid(userId)) {
			return false
		}

		const result = await this.UserModel.deleteOne({ _id: new ObjectId(userId) })

		return result.deletedCount === 1
	}*/

	mapDbUserToServiceUser(DbUser: PGGetUserQuery): UserServiceModel {
		return {
			id: DbUser.id.toString(),
			account: {
				login: DbUser.login,
				email: DbUser.email,
				password: DbUser.password,
				passwordRecoveryCode: DbUser.passwordrecoverycode,
				createdAt: DbUser.createdat,
			},
			emailConfirmation: {
				confirmationCode: DbUser.emailconfirmationcode,
				expirationDate: new Date(DbUser.confirmationcodeexpirationdate),
				isConfirmed: DbUser.isconfirmationemailcodeconfirmed,
			},
		}
	}
}
