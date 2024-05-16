import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { HashAdapter } from './base/adapters/hash.adapter'
import { BrowserService } from './base/application/browser.service'
import { JwtService } from './base/application/jwt.service'
import { RequestService } from './base/application/request.service'
import { RateLimit, RateLimitSchema } from './db/mongo/schemas/rateLimit.schema'
import { User, UserSchema } from './db/mongo/schemas/user.schema'
import { PgTablesCreator } from './db/pg/TablesCreator'
import { AuthModule } from './features/auth/auth.module'
import { BlogsModule } from './features/blogs/blogs.module'
import { CommonService } from './features/common/common.service'
import { SecurityModule } from './features/security/security.module'
import { TestsModule } from './features/test/tests.module'
import { UsersModule } from './features/users/users.module'
import { UsersMongoRepository } from './features/users/users.mongo.repository'
import { RequestsLimiterMiddleware } from './infrastructure/middlewares/requestsLimiter.middleware'
import { SetReqUserMiddleware } from './infrastructure/middlewares/setReqUser.middleware'
import { RouteNames } from './settings/routeNames'

const { MONGO_URL, DB_NAME, DB_USER_NAME, DB_USER_PASSWORD, DB_TYPE, POSTGRES_PORT } = process.env

@Module({
	imports: [
		ConfigModule.forRoot(),
		MongooseModule.forRoot(MONGO_URL, { dbName: DB_NAME }),
		// Ограничитель можно сделать отдельным пакетом Limit throtller
		// Схемы в папку feature
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: RateLimit.name, schema: RateLimitSchema },
		]),
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: 'blogs-postgres',
			port: POSTGRES_PORT,
			username: DB_USER_NAME,
			password: DB_USER_PASSWORD,
			database: DB_NAME,
			entities: [],
			autoLoadEntities: false,
			synchronize: false,
		}),
		AuthModule,
		BlogsModule,
		UsersModule,
		SecurityModule,
		TestsModule,
	],
	controllers: [],
	providers: [
		CommonService,
		UsersMongoRepository,
		HashAdapter,
		JwtService,
		RequestService,
		BrowserService,
	],
})
export class AppModule implements NestModule {
	constructor(private dataSource: DataSource) {}

	// It creates empty Postgres tables if they are not exist
	async onModuleInit() {
		try {
			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS blogs (
	id SERIAL PRIMARY KEY,
  name VARCHAR,
  description VARCHAR,
  websiteUrl VARCHAR,
  createdAt DATE,
  isMembership BOOLEAN
)`,
				[],
			)
		} catch (error) {
			console.log(error)
		}
	}

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
