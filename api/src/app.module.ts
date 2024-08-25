import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { Blog } from './db/pg/entities/blog'
import { Comment } from './db/pg/entities/comment'
import { CommentLikes } from './db/pg/entities/commentLikes'
import { DeviceToken } from './db/pg/entities/deviceToken'
import { Post } from './db/pg/entities/post'
import { PostLikes } from './db/pg/entities/postLikes'
import { RateLimit } from './db/pg/entities/rateLimit'
import { User } from './db/pg/entities/user'
import { AuthModule } from './routes/auth/auth.module'
import { BloggerBlogsModule } from './routes/blogger/blogs/bloggerBlogs.module'
import { BlogsModule } from './routes/blogs/blogs.module'
import { PairGameModule } from './routes/pairGame/pairGame.module'
import { SaQuizQuestionsModule } from './routes/saQuestions/saQuestions.module'
import { SecurityModule } from './routes/security/security.module'
import { TestsModule } from './routes/test/tests.module'
import { UsersModule } from './routes/users/users.module'
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
		ScheduleModule.forRoot(),
		AuthModule,
		BlogsModule,
		BloggerBlogsModule,
		UsersModule,
		SecurityModule,
		TestsModule,
		SaQuizQuestionsModule,
		PairGameModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
