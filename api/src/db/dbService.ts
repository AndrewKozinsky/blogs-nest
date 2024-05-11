import { InjectModel } from '@nestjs/mongoose'
import dotenv from 'dotenv'
import { Model } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { Blog } from './schemas/blog.schema'
import { Comment } from './schemas/comment.schema'
import { CommentLike } from './schemas/commentLike.schema'
import { DeviceToken } from './schemas/deviceToken.schema'
import { Post } from './schemas/post.schema'
import { PostLike } from './schemas/postLike.schema'
import { RateLimit } from './schemas/rateLimit.schema'
import { User } from './schemas/user.schema'

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
	) {}

	async drop() {
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
	}
}
