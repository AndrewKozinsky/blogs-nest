import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from './base/adapters/hash.adapter'
import { BrowserService } from './base/application/browser.service'
import { JwtService } from './base/application/jwt.service'
import { RequestService } from './base/application/request.service'
import { RateLimit, RateLimitSchema } from './db/schemas/rateLimit.schema'
import { User, UserSchema } from './db/schemas/user.schema'
import { AuthModule } from './features/auth/auth.module'
import { BlogsModule } from './features/blogs/blogs.module'
import { CommonService } from './features/common/common.service'
import { SecurityModule } from './features/security/security.module'
import { TestsModule } from './features/test/tests.module'
import { UsersModule } from './features/users/users.module'
import { UsersRepository } from './features/users/users.repository'
import { RequestsLimiterMiddleware } from './infrastructure/middlewares/requestsLimiter.middleware'
import { SetReqUserMiddleware } from './infrastructure/middlewares/setReqUser.middleware'
import { RouteNames } from './settings/routeNames'

const mongoURI = process.env.MONGO_URL
const dbName = process.env.MONGO_DB_NAME

@Module({
	imports: [
		ConfigModule.forRoot(),
		MongooseModule.forRoot(mongoURI, { dbName }),
		// Ограничитель можно сделать отдельным пакетом Limit throller
		// Схемы в папку feature
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: RateLimit.name, schema: RateLimitSchema },
		]),
		AuthModule,
		BlogsModule,
		UsersModule,
		SecurityModule,
		TestsModule,
	],
	controllers: [],
	providers: [
		CommonService,
		UsersRepository,
		HashAdapter,
		JwtService,
		RequestService,
		BrowserService,
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
