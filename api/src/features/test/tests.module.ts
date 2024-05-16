import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DbService } from '../../db/mongo/dbService'
import { Blog, BlogSchema } from '../../db/mongo/schemas/blog.schema'
import { Comment, CommentSchema } from '../../db/mongo/schemas/comment.schema'
import { CommentLike, CommentLikeSchema } from '../../db/mongo/schemas/commentLike.schema'
import { DeviceToken, DeviceTokenSchema } from '../../db/mongo/schemas/deviceToken.schema'
import { Post, PostSchema } from '../../db/mongo/schemas/post.schema'
import { PostLike, PostLikeSchema } from '../../db/mongo/schemas/postLike.schema'
import { RateLimit, RateLimitSchema } from '../../db/mongo/schemas/rateLimit.schema'
import { User, UserSchema } from '../../db/mongo/schemas/user.schema'
import { TestsController } from './tests.controller'

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
	providers: [DbService],
})
export class TestsModule {}
