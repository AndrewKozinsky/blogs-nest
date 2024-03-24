import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ObjectId } from 'mongodb'
import { FilterQuery, Model } from 'mongoose'
import { DBTypes } from '../../db/dbTypes'
import { CommonService } from '../common/common.service'
import { User, UserDocument } from '../../db/schemas/user.schema'
import { GetUsersQueries } from './models/users.input.model'
import { GetUserOutModel, GetUsersOutModel, UserOutModel } from './models/users.output.model'

@Injectable()
export class UsersQueryRepository {
	constructor(@InjectModel(User.name) private UserModel: Model<User>) {}

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
			items: getUsersRes.map(this.mapDbUserToOutputUser),
		}
	}

	async getUser(userId: string): Promise<null | GetUserOutModel> {
		if (!ObjectId.isValid(userId)) {
			return null
		}

		const getUserRes = await this.UserModel.findOne({ _id: new ObjectId(userId) })

		return getUserRes ? this.mapDbUserToOutputUser(getUserRes) : null
	}

	mapDbUserToOutputUser(DbUser: UserDocument): UserOutModel {
		return {
			id: DbUser._id.toString(),
			email: DbUser.account.email,
			login: DbUser.account.login,
			createdAt: DbUser.account.createdAt,
		}
	}
}
