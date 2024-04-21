import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { Blog, BlogSchema } from '../../db/schemas/blog.schema'
import { Comment, CommentSchema } from '../../db/schemas/comment.schema'
import { CommentLike, CommentLikeSchema } from '../../db/schemas/commentLike.schema'
import { Post, PostSchema } from '../../db/schemas/post.schema'
import { PostLike, PostLikeSchema } from '../../db/schemas/postLike.schema'
import { User, UserSchema } from '../../db/schemas/user.schema'
import { CommentLikesRepository } from './commentLikes/CommentLikes.repository'
import { CommentsController } from './comments/comments.controller'
import { CommentsQueryRepository } from './comments/comments.queryRepository'
import { CommentsRepository } from './comments/comments.repository'
import { CommonService } from '../common/common.service'
import { PostLikesRepository } from './postLikes/postLikes.repository'
import { DeleteCommentUseCase } from './comments/use-cases/DeleteCommentUseCase'
import { SetCommentLikeStatusUseCase } from './comments/use-cases/SetCommentLikeStatusUseCase'
import { UpdateCommentUseCase } from './comments/use-cases/UpdateCommentUseCase'
import { BlogIdValidation } from './posts/model/posts.input.model'
import { PostsController } from './posts/posts.controller'
import { PostsQueryRepository } from './posts/posts.queryRepository'
import { PostsRepository } from './posts/posts.repository'
import { CreatePostCommentUseCase } from './posts/use-cases/createPostCommentUseCase'
import { CreatePostUseCase } from './posts/use-cases/createPostUseCase'
import { UsersRepository } from '../users/users.repository'
import { BlogsController } from './blogs/blogs.controller'
import { BlogsQueryRepository } from './blogs/blogs.queryRepository'
import { BlogsRepository } from './blogs/blogs.repository'
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
		BlogsQueryRepository,
		BlogsRepository,
		PostsQueryRepository,
		PostLikesRepository,
		UsersRepository,
		CommonService,
		HashAdapter,
		PostsRepository,
		CommentLikesRepository,
		CommentsQueryRepository,
		CommentsRepository,
		BlogIdValidation,
		...useCases,
	],
})
export class BlogsModule {}
