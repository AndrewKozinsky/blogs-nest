import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DbService } from '../../db/dbService'
import { Blog, BlogSchema } from '../../db/schemas/blog.schema'
import { Comment, CommentSchema } from '../../db/schemas/comment.schema'
import { CommentLike, CommentLikeSchema } from '../../db/schemas/commentLike.schema'
import { DeviceToken, DeviceTokenSchema } from '../../db/schemas/deviceToken.schema'
import { Post, PostSchema } from '../../db/schemas/post.schema'
import { PostLike, PostLikeSchema } from '../../db/schemas/postLike.schema'
import { RateLimit, RateLimitSchema } from '../../db/schemas/rateLimit.schema'
import { User, UserSchema } from '../../db/schemas/user.schema'
import { TestsController } from './tests.controller'

const useCases = []

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: DeviceToken.name, schema: DeviceTokenSchema },
			{ name: Blog.name, schema: BlogSchema },
			{ name: Post.name, schema: PostSchema },
			{ name: PostLike.name, schema: PostLikeSchema },
			{ name: User.name, schema: UserSchema },
			{ name: Comment.name, schema: CommentSchema },
			{ name: CommentLike.name, schema: CommentLikeSchema },
			{ name: DeviceToken.name, schema: DeviceTokenSchema },
			{ name: RateLimit.name, schema: RateLimitSchema },
		]),
	],
	controllers: [TestsController],
	providers: [DbService, ...useCases],
})
export class TestsModule {}
