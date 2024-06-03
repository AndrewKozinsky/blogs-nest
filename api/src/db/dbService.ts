import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import dotenv from 'dotenv'
import { Model } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { Blog } from './mongo/schemas/blog.schema'
import { Comment } from './mongo/schemas/comment.schema'
import { CommentLike } from './mongo/schemas/commentLike.schema'
import { DeviceToken } from './mongo/schemas/deviceToken.schema'
import { Post } from './mongo/schemas/post.schema'
import { PostLike } from './mongo/schemas/postLike.schema'
import { RateLimit } from './mongo/schemas/rateLimit.schema'
import { User } from './mongo/schemas/user.schema'

dotenv.config()

const mongoURI = process.env.MONGO_URL

@Injectable()
export class DbService {
	constructor(
		@InjectModel(Blog.name) private BlogModel: Model<Blog>,
		@InjectModel(Comment.name) private CommentModel: Model<Comment>,
		@InjectModel(CommentLike.name) private CommentLikeModel: Model<CommentLike>,
		@InjectModel(DeviceToken.name) private DeviceTokenModel: Model<DeviceToken>,
		@InjectModel(Post.name) private PostModel: Model<Post>,
		@InjectModel(PostLike.name) private PostLikeModel: Model<PostLike>,
		@InjectModel(RateLimit.name) private RateLimitModel: Model<RateLimit>,
		@InjectModel(User.name) private UserModel: Model<User>,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async drop() {
		try {
			const tablesNames = [
				'ratelimites',
				'devicetokens',
				'commentlikes',
				'comments',
				'postlikes',
				'posts',
				'blogs',
				'users',
			]

			await new Promise((resolve, reject) => {
				tablesNames.forEach(async (tableName, i) => {
					await this.dataSource.query('DELETE FROM ' + tableName, [])

					if (i === tablesNames.length - 1) {
						resolve(true)
					}
				})
			})

			return true
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.log(err.message)
			}

			return false
		}
	}

	/*async dropByMongo() {
		try {
			const models = [
				this.BlogModel.deleteMany(),
				this.CommentModel.deleteMany(),
				this.CommentLikeModel.deleteMany(),
				this.DeviceTokenModel.deleteMany(),
				this.PostModel.deleteMany(),
				this.PostLikeModel.deleteMany(),
				this.RateLimitModel.deleteMany(),
				this.UserModel.deleteMany(),
			]

			await Promise.all(models)

			return true
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.log(err.message)
			}

			return false
		}
	}*/
}
