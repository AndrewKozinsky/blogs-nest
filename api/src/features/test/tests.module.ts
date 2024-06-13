import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DbService } from '../../db/dbService'
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
	imports: [],
	controllers: [TestsController],
	providers: [DbService],
})
export class TestsModule {}
