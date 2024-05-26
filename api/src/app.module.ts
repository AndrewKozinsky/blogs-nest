import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { HashAdapter } from './base/adapters/hash.adapter'
import { BrowserService } from './base/application/browser.service'
import { JwtService } from './base/application/jwt.service'
import { RequestService } from './base/application/request.service'
import { CommentLike } from './db/mongo/schemas/commentLike.schema'
import { DeviceToken } from './db/mongo/schemas/deviceToken.schema'
import { RateLimit, RateLimitSchema } from './db/mongo/schemas/rateLimit.schema'
import { User, UserSchema } from './db/mongo/schemas/user.schema'
import { PgTablesCreator } from './db/pg/TablesCreator'
import { AuthModule } from './features/auth/auth.module'
import { BlogsModule } from './features/blogs/blogs.module'
import { CommonService } from './features/common/common.service'
import { SecurityModule } from './features/security/security.module'
import { TestsModule } from './features/test/tests.module'
import { UsersModule } from './features/users/users.module'
import { UsersRepository } from './features/users/usersRepository'
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
			// url: 'postgresql://blogs_owner:ybZpRe4Es5oA@ep-curly-voice-a2q1fh7d.eu-central-1.aws.neon.tech/blogs?sslmode=require',
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
		UsersRepository,
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
		await this.dataSource.query(
			`CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	login VARCHAR,
	email VARCHAR,
	password VARCHAR,
	passwordRecoveryCode VARCHAR,
	createdAt timestamp with time zone,
	emailConfirmationCode VARCHAR,
	confirmationCodeExpirationDate TIMESTAMP,
	isConfirmationEmailCodeConfirmed BOOLEAN
)`,
			[],
		)

		try {
			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS blogs (
	id SERIAL PRIMARY KEY,
  name VARCHAR,
  description VARCHAR,
  websiteUrl VARCHAR,
  createdAt TIMESTAMP,
  isMembership BOOLEAN
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS posts (
	id SERIAL PRIMARY KEY,
	title VARCHAR,
  	shortDescription VARCHAR,
  	content TEXT,
  	createdAt TIMESTAMP,
    blogId SERIAL REFERENCES blogs(id)
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS postlikes (
	id SERIAL PRIMARY KEY,
	postId SERIAL REFERENCES posts(id),
	userId SERIAL REFERENCES users(id),
	status VARCHAR,
	addedAt TIMESTAMP
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS comments (
	id SERIAL PRIMARY KEY,
	content TEXT,
	postId SERIAL REFERENCES posts(id),
	userId SERIAL REFERENCES users(id),
	createdAt TIMESTAMP
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS commentlikes (
	id SERIAL PRIMARY KEY,
	commentId SERIAL REFERENCES comments(id),
	userId SERIAL REFERENCES users(id),
	status VARCHAR
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS ratelimites (
	id SERIAL PRIMARY KEY,
	ip VARCHAR,
	date TIMESTAMP,
	path VARCHAR,
	method VARCHAR
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS devicetokens (
	id SERIAL PRIMARY KEY,
	issuedAt timestamp with time zone,
	userId SERIAL REFERENCES users(id),
	expirationDate timestamp with time zone,
	deviceIP VARCHAR,
  	deviceId VARCHAR,
  	deviceName VARCHAR
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
