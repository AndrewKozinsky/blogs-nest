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
			const deleteCommentLikes = this.dataSource.query('DELETE FROM commentlikes', [])
			const deleteComments = this.dataSource.query('DELETE FROM comments', [])
			const deletePostLikes = this.dataSource.query('DELETE FROM postlikes', [])
			const deletePosts = this.dataSource.query('DELETE FROM posts', [])
			const deleteRateLimits = this.dataSource.query('DELETE FROM ratelimites', [])
			const deleteDeviceTokens = this.dataSource.query('DELETE FROM devicetokens', [])
			const deleteBlogs = this.dataSource.query('DELETE FROM blogs', [])
			const deleteUsers = this.dataSource.query('DELETE FROM users', [])

			const models = [
				deleteCommentLikes,
				deleteComments,
				deletePostLikes,
				deletePosts,
				deleteRateLimits,
				deleteDeviceTokens,
				deleteBlogs,
				deleteUsers,
			]

			await Promise.all(models)

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
