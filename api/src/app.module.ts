import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EmailAdapter } from './base/adapters/email.adapter'
import { HashAdapter } from './base/adapters/hash.adapter'
import { BrowserService } from './base/application/browser.service'
import { JwtService } from './base/application/jwt.service'
import { RequestService } from './base/application/request.service'
import { EmailManager } from './base/managers/email.manager'
import { DbService } from './db/dbService'
import { Comment, CommentSchema } from './db/schemas/comment.schema'
import { CommentLike } from './db/schemas/commentLike.schema'
import { DeviceToken, DeviceTokenSchema } from './db/schemas/deviceToken.schema'
import { Post, PostSchema } from './db/schemas/post.schema'
import { PostLike, PostLikeSchema } from './db/schemas/postLike.schema'
import { RateLimit, RateLimitSchema } from './db/schemas/rateLimit.schema'
import { User, UserSchema } from './db/schemas/user.schema'
import { AuthController } from './features/auth/auth.controller'
import { AuthRepository } from './features/auth/auth.repository'
import { AuthService } from './features/auth/auth.service'
import {
	IsEmailExistsValidation,
	IsLoginExistsValidation,
} from './features/auth/model/authRegistration.input.model'
import { IsRecoveryCodeExistsValidation } from './features/auth/model/newPassword.input.model'
import { BlogsController } from './features/blogs/blogs.controller'
import { BlogsQueryRepository } from './features/blogs/blogs.queryRepository'
import { BlogsRepository } from './features/blogs/blogs.repository'
import { BlogsService } from './features/blogs/blogs.service'
import { CommentLikesRepository } from './features/commentLikes/CommentLikes.repository'
import { CommentsController } from './features/comments/comments.controller'
import { CommentsQueryRepository } from './features/comments/comments.queryRepository'
import { CommentsRepository } from './features/comments/comments.repository'
import { CommentsService } from './features/comments/comments.service'
import { CommonService } from './features/common/common.service'
import { Blog, BlogSchema } from './db/schemas/blog.schema'
import { PostLikesRepository } from './features/postLikes/postLikes.repository'
import { BlogIdValidation } from './features/posts/model/posts.input.model'
import { PostsController } from './features/posts/posts.controller'
import { PostsQueryRepository } from './features/posts/posts.queryRepository'
import { PostsRepository } from './features/posts/posts.repository'
import { PostsService } from './features/posts/posts.service'
import { SecurityController } from './features/security/security.controller'
import { SecurityQueryRepository } from './features/security/security.queryRepository'
import { SecurityRepository } from './features/security/security.repository'
import { SecurityService } from './features/security/security.service'
import { TestsController } from './features/test/tests.controller'
import { UsersController } from './features/users/users.controller'
import { UsersQueryRepository } from './features/users/users.queryRepository'
import { UsersRepository } from './features/users/users.repository'
import { UsersService } from './features/users/users.service'
import { RequestsLimiterMiddleware } from './infrastructure/middlewares/requestsLimiter.middleware'
import { SetReqUserMiddleware } from './infrastructure/middlewares/setReqUser.middleware'
import { RouteNames } from './settings/routeNames'

const mongoURI = process.env.MONGO_URL
const dbName = process.env.MONGO_DB_NAME

@Module({
	imports: [
		MongooseModule.forRoot(mongoURI, { dbName }),
		MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
		MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
		MongooseModule.forFeature([{ name: PostLike.name, schema: PostLikeSchema }]),
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
		MongooseModule.forFeature([{ name: CommentLike.name, schema: CommentSchema }]),
		MongooseModule.forFeature([{ name: DeviceToken.name, schema: DeviceTokenSchema }]),
		MongooseModule.forFeature([{ name: RateLimit.name, schema: RateLimitSchema }]),
	],
	controllers: [
		BlogsController,
		CommentsController,
		PostsController,
		UsersController,
		TestsController,
		AuthController,
		SecurityController,
	],
	providers: [
		BlogsService,
		BlogsRepository,
		BlogsQueryRepository,
		PostsQueryRepository,
		CommonService,
		PostsService,
		PostsRepository,
		PostLikesRepository,
		UsersRepository,
		CommentsRepository,
		HashAdapter,
		CommentsQueryRepository,
		CommentLikesRepository,
		CommentsService,
		UsersQueryRepository,
		UsersService,
		DbService,
		AuthService,
		JwtService,
		RequestService,
		AuthRepository,
		EmailManager,
		BrowserService,
		EmailAdapter,
		SecurityQueryRepository,
		SecurityService,
		SecurityRepository,
		IsLoginExistsValidation,
		IsEmailExistsValidation,
		IsRecoveryCodeExistsValidation,
		BlogIdValidation,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(SetReqUserMiddleware)
			.forRoutes('*')
			.apply(RequestsLimiterMiddleware)
			.forRoutes({
				path: RouteNames.AUTH.LOGIN.full,
				method: RequestMethod.POST,
			})
			.apply(RequestsLimiterMiddleware)
			.forRoutes({
				path: RouteNames.AUTH.REFRESH_TOKEN.full,
				method: RequestMethod.POST,
			})
			.apply(RequestsLimiterMiddleware)
			.forRoutes({
				path: RouteNames.AUTH.REGISTRATION.full,
				method: RequestMethod.POST,
			})
			.apply(RequestsLimiterMiddleware)
			.forRoutes({
				path: RouteNames.AUTH.REGISTRATION_EMAIL_RESENDING.full,
				method: RequestMethod.POST,
			})
			.apply(RequestsLimiterMiddleware)
			.forRoutes({
				path: RouteNames.AUTH.REGISTRATION_CONFIRMATION.full,
				method: RequestMethod.POST,
			})
			.apply(RequestsLimiterMiddleware)
			.forRoutes({
				path: RouteNames.AUTH.PASSWORD_RECOVERY.full,
				method: RequestMethod.POST,
			})
			.apply(RequestsLimiterMiddleware)
			.forRoutes({
				path: RouteNames.AUTH.NEW_PASSWORD.full,
				method: RequestMethod.POST,
			})
	}
}
