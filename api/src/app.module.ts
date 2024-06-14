import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { HashAdapter } from './base/adapters/hash.adapter'
import { JwtService } from './base/application/jwt.service'
import { BrowserService } from './base/application/browser.service'
import { Blog } from './db/pg/entities/blog.entity'
import { RequestService } from './base/application/request.service'
import { Comment } from './db/pg/entities/comment'
import { CommentLikes } from './db/pg/entities/commentLikes'
import { DeviceToken } from './db/pg/entities/deviceToken'
import { Post } from './db/pg/entities/post'
import { PostLikes } from './db/pg/entities/postLikes'
import { RateLimit } from './db/pg/entities/rateLimit'
import { User } from './db/pg/entities/user'
import { AuthModule } from './features/auth/auth.module'
import { CommonService } from './features/common/common.service'
import { BlogsModule } from './features/blogs/blogs.module'
import { SecurityModule } from './features/security/security.module'
import { TestsModule } from './features/test/tests.module'
import { UsersModule } from './features/users/users.module'
import { RequestsLimiterMiddleware } from './infrastructure/middlewares/requestsLimiter.middleware'
import { UsersRepository } from './features/users/usersRepository'
import { RouteNames } from './settings/routeNames'
import { SetReqUserMiddleware } from './infrastructure/middlewares/setReqUser.middleware'
import 'reflect-metadata'

const { DB_NAME, DB_USER_NAME, DB_USER_PASSWORD, POSTGRES_PORT } = process.env

@Module({
	imports: [
		ConfigModule.forRoot(),
		// Ограничитель можно сделать отдельным пакетом Limit throtller
		// Схемы в папку feature
		TypeOrmModule.forRoot({
			// url: 'postgresql://blogs_owner:ybZpRe4Es5oA@ep-curly-voice-a2q1fh7d.eu-central-1.aws.neon.tech/blogs?sslmode=require',
			type: 'postgres',
			host: 'blogs-postgres',
			port: POSTGRES_PORT,
			username: DB_USER_NAME,
			password: DB_USER_PASSWORD,
			database: DB_NAME,
			entities: [User, Blog, Post, PostLikes, Comment, CommentLikes, RateLimit, DeviceToken],
			// entities: ['./db/pg/entities/*.entity.ts'],
			autoLoadEntities: true,
			synchronize: true,
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

	/*async onModuleInit() {
		// It creates empty Postgres tables if they are not exist
		await this.dataSource.query(
			`CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	login VARCHAR,
	email VARCHAR,
	password VARCHAR,
	passwordRecoveryCode VARCHAR,
	createdAt VARCHAR,
	emailConfirmationCode VARCHAR,
	confirmationCodeExpirationDate VARCHAR,
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
  createdAt VARCHAR,
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
  	createdAt VARCHAR,
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
	addedAt VARCHAR
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS comments (
	id SERIAL PRIMARY KEY,
	content TEXT,
	postId SERIAL REFERENCES posts(id),
	userId SERIAL REFERENCES users(id),
	createdAt VARCHAR
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
	date VARCHAR,
	path VARCHAR,
	method VARCHAR
)`,
				[],
			)

			await this.dataSource.query(
				`CREATE TABLE IF NOT EXISTS devicetokens (
	id SERIAL PRIMARY KEY,
	issuedAt VARCHAR,
	userId SERIAL REFERENCES users(id),
	expirationDate VARCHAR,
	deviceIP VARCHAR,
  	deviceId VARCHAR,
  	deviceName VARCHAR
)`,
				[],
			)
		} catch (error) {
			console.log(error)
		}
	}*/

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
