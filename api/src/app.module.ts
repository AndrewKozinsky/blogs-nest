import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from './adapters/hash.adapter'
import { DbService } from './db/dbService'
import { Comment, CommentSchema } from './db/schemas/comment.schema'
import { CommentLike } from './db/schemas/commentLike.schema'
import { Post, PostSchema } from './db/schemas/post.schema'
import { PostLike, PostLikeSchema } from './db/schemas/PostLike.schema'
import { User, UserSchema } from './db/schemas/user.schema'
import { BlogsController } from './domains/blogs/blogs.controller'
import { BlogsQueryRepository } from './domains/blogs/blogs.queryRepository'
import { BlogsRepository } from './domains/blogs/blogs.repository'
import { BlogsService } from './domains/blogs/blogs.service'
import { CommentLikesRepository } from './domains/commentLikes/CommentLikes.repository'
import { CommentsController } from './domains/comments/comments.controller'
import { CommentsQueryRepository } from './domains/comments/comments.queryRepository'
import { CommentsRepository } from './domains/comments/comments.repository'
import { CommentsService } from './domains/comments/comments.service'
import { CommonService } from './domains/common/common.service'
import { Blog, BlogSchema } from './db/schemas/blog.schema'
import { PostLikesRepository } from './domains/postLikes/postLikes.repository'
import { PostsController } from './domains/posts/posts.controller'
import { PostsQueryRepository } from './domains/posts/posts.queryRepository'
import { PostsRepository } from './domains/posts/posts.repository'
import { PostsService } from './domains/posts/posts.service'
import { TestsController } from './domains/test/tests.controller'
import { UsersController } from './domains/users/users.controller'
import { UsersQueryRepository } from './domains/users/users.queryRepository'
import { UsersRepository } from './domains/users/users.repository'
import { UsersService } from './domains/users/users.service'

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
	],
	controllers: [
		BlogsController,
		CommentsController,
		PostsController,
		UsersController,
		TestsController,
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
	],
})
export class AppModule {}
