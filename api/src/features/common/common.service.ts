import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { User } from '../../db/pg/entities/user'
import { PGGetUserQuery } from '../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../utils/numbers'
import { createUniqString } from '../../utils/stringUtils'
import { UserServiceModel } from '../users/models/users.service.model'
import { add } from 'date-fns'

@Injectable()
export class CommonService {
	constructor(
		private hashAdapter: HashAdapter,
		@InjectDataSource() private dataSource: DataSource,
		@InjectRepository(User) private readonly usersTypeORM: Repository<User>,
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

	async createUser(dto: Omit<PGGetUserQuery, 'id'>): Promise<string> {
		const newUserRes = await this.usersTypeORM.insert({
			login: dto.login,
			email: dto.email,
			password: dto.password,
			passwordRecoveryCode: dto.passwordrecoverycode,
			createdAt: dto.createdat,
			emailConfirmationCode: dto.emailconfirmationcode,
			confirmationCodeExpirationDate: dto.confirmationcodeexpirationdate,
			isConfirmationEmailCodeConfirmed: dto.isconfirmationemailcodeconfirmed,
		})
		console.log(newUserRes)

		return '1'
	}

	/*async createUserNative(dto: Omit<PGGetUserQuery, 'id'>) {
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

	mapDbUserToServiceUser(DbUser: User): UserServiceModel {
		return {
			id: DbUser.id.toString(),
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
