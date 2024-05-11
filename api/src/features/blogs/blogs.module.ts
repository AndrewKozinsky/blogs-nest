import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { Blog, BlogSchema } from '../../db/schemas/blog.schema'
import { Comment, CommentSchema } from '../../db/schemas/comment.schema'
import { CommentLike, CommentLikeSchema } from '../../db/schemas/commentLike.schema'
import { Post, PostSchema } from '../../db/schemas/post.schema'
import { PostLike, PostLikeSchema } from '../../db/schemas/postLike.schema'
import { User, UserSchema } from '../../db/schemas/user.schema'
import { BlogsMongoQueryRepository } from './blogs/blogs.mongo.queryRepository'
import { CommentLikesMongoRepository } from './commentLikes/CommentLikes.mongo.repository'
import { CommentsController } from './comments/comments.controller'
import { CommentsMongoQueryRepository } from './comments/comments.mongo.queryRepository'
import { CommentsMongoRepository } from './comments/comments.mongo.repository'
import { CommonService } from '../common/common.service'
import { PostLikesMongoRepository } from './postLikes/postLikes.mongo.repository'
import { DeleteCommentUseCase } from './comments/use-cases/DeleteCommentUseCase'
import { SetCommentLikeStatusUseCase } from './comments/use-cases/SetCommentLikeStatusUseCase'
import { UpdateCommentUseCase } from './comments/use-cases/UpdateCommentUseCase'
import { BlogIdValidation } from './posts/model/posts.input.model'
import { PostsController } from './posts/posts.controller'
import { PostsMongoQueryRepository } from './posts/posts.mongo.queryRepository'
import { PostsMongoRepository } from './posts/posts.mongo.repository'
import { CreatePostCommentUseCase } from './posts/use-cases/createPostCommentUseCase'
import { CreatePostUseCase } from './posts/use-cases/createPostUseCase'
import { UsersMongoRepository } from '../users/users.mongo.repository'
import { BlogsController } from './blogs/blogs.controller'
import { BlogsMongoRepository } from './blogs/blogs.mongo.repository'
import { CreateBlogPostUseCase } from './blogs/use-cases/CreateBlogPostUseCase'
import { CreateBlogUseCase } from './blogs/use-cases/CreateBlogUseCase'
import { DeleteBlogUseCase } from './blogs/use-cases/DeleteBlogUseCase'
import { UpdateBlogUseCase } from './blogs/use-cases/UpdateBlogUseCase'
import { DeletePostUseCase } from './posts/use-cases/deletePostUseCase'
import { SetPostLikeStatusUseCase } from './posts/use-cases/setPostLikeStatusUseCase'
import { UpdatePostUseCase } from './posts/use-cases/updatePostUseCase'

const useCases = [
	CreateBlogUseCase,
	CreateBlogPostUseCase,
	UpdateBlogUseCase,
	DeleteBlogUseCase,
	CreatePostUseCase,
	UpdatePostUseCase,
	DeletePostUseCase,
	CreatePostCommentUseCase,
	SetPostLikeStatusUseCase,
	UpdateCommentUseCase,
	DeleteCommentUseCase,
	SetCommentLikeStatusUseCase,
]

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: Blog.name, schema: BlogSchema },
			{ name: Post.name, schema: PostSchema },
			{ name: PostLike.name, schema: PostLikeSchema },
			{ name: Comment.name, schema: CommentSchema },
			{ name: CommentLike.name, schema: CommentLikeSchema },
		]),
	],
	controllers: [BlogsController, PostsController, CommentsController],
	providers: [
		BlogsMongoQueryRepository,
		BlogsMongoRepository,
		PostsMongoQueryRepository,
		PostLikesMongoRepository,
		UsersMongoRepository,
		CommonService,
		HashAdapter,
		PostsMongoRepository,
		CommentLikesMongoRepository,
		CommentsMongoQueryRepository,
		CommentsMongoRepository,
		BlogIdValidation,
		...useCases,
	],
})
export class BlogsModule {}
