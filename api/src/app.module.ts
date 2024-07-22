import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { Blog } from './db/pg/entities/blog'
import { Comment } from './db/pg/entities/comment'
import { CommentLikes } from './db/pg/entities/commentLikes'
import { DeviceToken } from './db/pg/entities/deviceToken'
import { Post } from './db/pg/entities/post'
import { PostLikes } from './db/pg/entities/postLikes'
import { RateLimit } from './db/pg/entities/rateLimit'
import { User } from './db/pg/entities/user'
import { AuthModule } from './features/auth/auth.module'
import { BlogsModule } from './features/blogs/blogs.module'
import { SaQuizQuestionsModule } from './features/saQuizQuestions/saQuizQuestions.module'
import { SecurityModule } from './features/security/security.module'
import { TestsModule } from './features/test/tests.module'
import { UsersModule } from './features/users/users.module'
import 'reflect-metadata'

const { DB_NAME, DB_USER_NAME, DB_USER_PASSWORD, POSTGRES_PORT } = process.env

const typeORMOptions: TypeOrmModuleOptions = {
	// url: 'postgresql://blogs_owner:ybZpRe4Es5oA@ep-curly-voice-a2q1fh7d.eu-central-1.aws.neon.tech/blogs?sslmode=require',
	type: 'postgres',
	host: 'blogs-postgres',
	port: POSTGRES_PORT,
	username: DB_USER_NAME,
	password: DB_USER_PASSWORD,
	database: DB_NAME,
	entities: [Blog, Comment, CommentLikes, DeviceToken, Post, PostLikes, User, RateLimit],
	autoLoadEntities: true,
	synchronize: true,
	// logging: ['query'],
}

@Module({
	imports: [
		ConfigModule.forRoot(),
		// Ограничитель можно сделать отдельным пакетом Limit throtller
		// Схемы в папку feature
		TypeOrmModule.forRoot(typeORMOptions),
		AuthModule,
		BlogsModule,
		UsersModule,
		SecurityModule,
		TestsModule,
		SaQuizQuestionsModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
