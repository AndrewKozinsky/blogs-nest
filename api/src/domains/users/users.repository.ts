import { Injectable } from '@nestjs/common'
// import { DBTypes } from '../db/dbTypes'
// import { Post } from '../db/schemas/post.schema'
// import {PostLike} from '../db/schemas/PostLike.schema'
// import { PostLikesRepository } from '../postLikes/postLikes.repository'
// import { GetPostsQueries } from './model/posts.input.model'
// import { GetPostsOutModel } from './model/posts.output.model'
import { InjectModel } from '@nestjs/mongoose'
// import { FilterQuery, Model } from 'mongoose'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { DBTypes } from '../../db/dbTypes'
import { CommonService } from '../common/common.service'
import { User, UserDocument } from '../../db/schemas/user.schema'
import { UserServiceModel } from './models/users.service.model'
// import { DBTypes } from '../../db/dbTypes'
// import { Blog, BlogDocument } from '../../db/schemas/blog.schema'
// import { PostOutModel } from '../../posts/model/posts.output.model'
// import { GetBlogPostsQueries, GetBlogsQueries } from './model/blogs.input.model'
// import {
// 	BlogOutModel,
// 	GetBlogOutModel,
// 	GetBlogPostsOutModel,
// 	GetBlogsOutModel,
// } from './model/blogs.output.model'

@Injectable()
export class UsersRepository {
	constructor(
		@InjectModel(User.name) private UserModel: Model<User>,
		private commonService: CommonService,
	) {}

	async getUserById(userId: string) {
		if (!ObjectId.isValid(userId)) {
			return null
		}

		const getUserRes = await this.UserModel.findOne({ _id: new ObjectId(userId) })

		if (!getUserRes) return null

		return this.mapDbUserToServiceUser(getUserRes)
	}

	/*async getUserByPasswordRecoveryCode(passwordRecoveryCode: string) {
		const getUserRes = await this.UserModel.findOne({
			'account.passwordRecoveryCode': passwordRecoveryCode,
		}).lean()

		if (!getUserRes) return null

		return this.mapDbUserToServiceUser(getUserRes)
	}*/

	async createUser(dto: DBTypes.User) {
		return this.commonService.createUser(dto)
	}

	async deleteUser(userId: string): Promise<boolean> {
		return this.commonService.deleteUser(userId)
	}

	mapDbUserToServiceUser(dbUser: UserDocument): UserServiceModel {
		return this.commonService.mapDbUserToServiceUser(dbUser)
	}

	/*async setPasswordRecoveryCodeToUser(userId: string, recoveryCode: null | string) {
		await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'account.passwordRecoveryCode': recoveryCode } },
		)
	}*/

	/*async setNewPasswordToUser(userId: string, newPassword: string) {
		const passwordHash = await this.hashService.hashString(newPassword)

		await this.UserModel.updateOne(
			{ _id: new ObjectId(userId) },
			{ $set: { 'account.password': passwordHash } },
		)
	}*/
}
