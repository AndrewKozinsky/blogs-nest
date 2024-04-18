import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CqrsModule } from '@nestjs/cqrs'
import { MongooseModule } from '@nestjs/mongoose'
import { EmailAdapter } from './base/adapters/email.adapter'
import { HashAdapter } from './base/adapters/hash.adapter'
import { BrowserService } from './base/application/browser.service'
import { JwtService } from './base/application/jwt.service'
import { RequestService } from './base/application/request.service'
import { EmailManager } from './base/managers/email.manager'
import { DbService } from './db/dbService'
import { Comment, CommentSchema } from './db/schemas/comment.schema'
import { CommentLike, CommentLikeSchema } from './db/schemas/commentLike.schema'
import { DeviceToken, DeviceTokenSchema } from './db/schemas/deviceToken.schema'
import { Post, PostSchema } from './db/schemas/post.schema'
import { PostLike, PostLikeSchema } from './db/schemas/postLike.schema'
import { RateLimit, RateLimitSchema } from './db/schemas/rateLimit.schema'
import { User, UserSchema } from './db/schemas/user.schema'
import { AuthController } from './features/auth/auth.controller'
import { AuthRepository } from './features/auth/auth.repository'
import {
	IsEmailExistsValidation,
	IsLoginExistsValidation,
} from './features/auth/model/authRegistration.input.model'
import { CodeCustomValidation } from './features/auth/model/authRegistrationConfirmation.input.model'
import { IsEmailExistsValidationInAuthRegistrationEmailResendingDto } from './features/auth/model/authRegistrationEmailResending.input.model'
import { IsRecoveryCodeExistsValidation } from './features/auth/model/newPassword.input.model'
import { ConfirmEmailAfterRegistrationUseCase } from './features/auth/use-cases/confirmEmailAfterRegistration.useCase'
import { GenerateAccessAndRefreshTokensUseCase } from './features/auth/use-cases/generateAccessAndRefreshTokens.useCase'
import { GetCurrentUserUseCase } from './features/auth/use-cases/getCurrentUser.useCase'
import { LoginUseCase } from './features/auth/use-cases/login.useCase'
import { LogoutUseCase } from './features/auth/use-cases/logout.useCase'
import { RecoveryPasswordUseCase } from './features/auth/use-cases/recoveryPassword.useCase'
import { RegistrationUseCase } from './features/auth/use-cases/registration.useCase'
import { RegistrationEmailResendingUseCase } from './features/auth/use-cases/registrationEmailResending.useCase'
import { SetNewPasswordUseCase } from './features/auth/use-cases/setNewPassword.useCase'
import { BlogsController } from './features/blogs/blogs.controller'
import { BlogsQueryRepository } from './features/blogs/blogs.queryRepository'
import { BlogsRepository } from './features/blogs/blogs.repository'
import { CreateBlogPostUseCase } from './features/blogs/use-cases/CreateBlogPostUseCase'
import { CreateBlogUseCase } from './features/blogs/use-cases/CreateBlogUseCase'
import { DeleteBlogUseCase } from './features/blogs/use-cases/DeleteBlogUseCase'
import { UpdateBlogUseCase } from './features/blogs/use-cases/UpdateBlogUseCase'
import { CommentLikesRepository } from './features/commentLikes/CommentLikes.repository'
import { CommentsController } from './features/comments/comments.controller'
import { CommentsQueryRepository } from './features/comments/comments.queryRepository'
import { CommentsRepository } from './features/comments/comments.repository'
import { CommentsService } from './features/comments/comments.service'
import { DeleteCommentUseCase } from './features/comments/use-cases/DeleteCommentUseCase'
import { SetCommentLikeStatusUseCase } from './features/comments/use-cases/SetCommentLikeStatusUseCase'
import { UpdateCommentUseCase } from './features/comments/use-cases/UpdateCommentUseCase'
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
import { CreateUserUseCase } from './features/users/use-cases/createUser.useCase'
import { DeleteUserUseCase } from './features/users/use-cases/deleteUser.useCase'
import { UsersController } from './features/users/users.controller'
import { UsersQueryRepository } from './features/users/users.queryRepository'
import { UsersRepository } from './features/users/users.repository'
import { UsersService } from './features/users/users.service'
import { RequestsLimiterMiddleware } from './infrastructure/middlewares/requestsLimiter.middleware'
import { SetReqUserMiddleware } from './infrastructure/middlewares/setReqUser.middleware'
import { RouteNames } from './settings/routeNames'

const mongoURI = process.env.MONGO_URL
const dbName = process.env.MONGO_DB_NAME

const useCases = [
	CreateUserUseCase,
	DeleteUserUseCase,
	LoginUseCase,
	GenerateAccessAndRefreshTokensUseCase,
	RegistrationUseCase,
	RegistrationEmailResendingUseCase,
	ConfirmEmailAfterRegistrationUseCase,
	GetCurrentUserUseCase,
	LogoutUseCase,
	RecoveryPasswordUseCase,
	SetNewPasswordUseCase,
	CreateBlogUseCase,
	CreateBlogPostUseCase,
	UpdateBlogUseCase,
	DeleteBlogUseCase,
	UpdateCommentUseCase,
	DeleteCommentUseCase,
	SetCommentLikeStatusUseCase,
]

@Module({
	imports: [
		ConfigModule.forRoot(),
		MongooseModule.forRoot(mongoURI, { dbName }),
		// Ограничитель можно сделать отдельным пакетом Limit throller
		// Схемы в папку feature
		MongooseModule.forFeature([
			{ name: Blog.name, schema: BlogSchema },
			{ name: Post.name, schema: PostSchema },
			{ name: PostLike.name, schema: PostLikeSchema },
			{ name: User.name, schema: UserSchema },
			{ name: Comment.name, schema: CommentSchema },
			{ name: CommentLike.name, schema: CommentLikeSchema },
			{ name: DeviceToken.name, schema: DeviceTokenSchema },
			{ name: RateLimit.name, schema: RateLimitSchema },
		]),
		CqrsModule,
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
		CodeCustomValidation,
		IsEmailExistsValidationInAuthRegistrationEmailResendingDto,
		...useCases,
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
