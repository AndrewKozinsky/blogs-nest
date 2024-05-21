import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { ObjectId } from 'mongodb'
import { FilterQuery, Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../db/mongo/dbTypes'
import { User, UserDocument } from '../../db/mongo/schemas/user.schema'
import { PGGetUserQuery } from '../../db/pg/blogs'
import { convertToNumber } from '../../utils/numbers'
import { GetUsersQueries } from './models/users.input.model'
import { GetUserOutModel, GetUsersOutModel, UserOutModel } from './models/users.output.model'

@Injectable()
export class UsersQueryRepository {
	constructor(
		@InjectModel(User.name) private UserModel: Model<User>,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	//<Omit<PGGetUserQuery, 'id'>>
	async getUsers(queries: GetUsersQueries): Promise<GetUsersOutModel> {
		const filter: FilterQuery<DBTypes.User> = {
			$or: [
				{ 'account.login': { $regex: queries.searchLoginTerm ?? '', $options: 'i' } },
				{ 'account.email': { $regex: queries.searchEmailTerm ?? '', $options: 'i' } },
			],
		}

		const sortBy = queries.sortBy ?? 'createdAt'
		const sortDirection = queries.sortDirection ?? 'desc'
		const sort = { ['account.' + sortBy]: sortDirection }

		const pageNumber = queries.pageNumber ? +queries.pageNumber : 1
		const pageSize = queries.pageSize ? +queries.pageSize : 10

		const totalUsersCount = await this.UserModel.countDocuments(filter)

		const pagesCount = Math.ceil(totalUsersCount / pageSize)

		const getUsersRes = await this.UserModel.find(filter)
			.sort(sort)
			.skip((pageNumber - 1) * pageSize)
			.limit(pageSize)
			.lean()

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: totalUsersCount,
			// @ts-ignore
			items: getUsersRes.map(this.mapDbUserToOutputUser),
		}
	}

	async getUser(userId: string): Promise<null | GetUserOutModel> {
		const userIdNum = convertToNumber(userId)
		if (!userIdNum) {
			return null
		}

		const usersRes = await this.dataSource.query(`SELECT * FROM users WHERE id=${userId}`, [])

		if (!usersRes.length) {
			return null
		}

		return usersRes ? this.mapDbUserToOutputUser(usersRes) : null
	}

	/*async getUserByMongo(userId: string): Promise<null | GetUserOutModel> {
		if (!ObjectId.isValid(userId)) {
			return null
		}

		const getUserRes = await this.UserModel.findOne({ _id: new ObjectId(userId) })

		return getUserRes ? this.mapDbUserToOutputUser(getUserRes) : null
	}*/

	mapDbUserToOutputUser(DbUser: PGGetUserQuery): UserOutModel {
		return {
			id: DbUser.id,
			email: DbUser.email,
			login: DbUser.login,
			createdAt: DbUser.createdAt,
		}
	}
}
