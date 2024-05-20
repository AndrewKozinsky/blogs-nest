import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { Blog, BlogSchema } from '../../db/mongo/schemas/blog.schema'
import { Comment, CommentSchema } from '../../db/mongo/schemas/comment.schema'
import { CommentLike, CommentLikeSchema } from '../../db/mongo/schemas/commentLike.schema'
import { Post, PostSchema } from '../../db/mongo/schemas/post.schema'
import { PostLike, PostLikeSchema } from '../../db/mongo/schemas/postLike.schema'
import { User, UserSchema } from '../../db/mongo/schemas/user.schema'
import { BlogsQueryRepository } from './blogs/blogsQueryRepository'
import { CommentLikesRepository } from './commentLikes/CommentLikesRepository'
import { CommentsController } from './comments/comments.controller'
import { CommentsQueryRepository } from './comments/commentsQueryRepository'
import { CommentsRepository } from './comments/commentsRepository'
import { CommonService } from '../common/common.service'
import { PostLikesRepository } from './postLikes/postLikesRepository'
import { DeleteCommentUseCase } from './comments/use-cases/DeleteCommentUseCase'
import { SetCommentLikeStatusUseCase } from './comments/use-cases/SetCommentLikeStatusUseCase'
import { UpdateCommentUseCase } from './comments/use-cases/UpdateCommentUseCase'
import { BlogIdValidation } from './posts/model/posts.input.model'
import { PostsController } from './posts/posts.controller'
import { PostsQueryRepository } from './posts/postsQueryRepository'
import { PostsRepository } from './posts/postsRepository'
import { CreatePostCommentUseCase } from './posts/use-cases/createPostCommentUseCase'
import { CreatePostUseCase } from './posts/use-cases/createPostUseCase'
import { UsersRepository } from '../users/usersRepository'
import { BlogsController } from './blogs/blogs.controller'
import { BlogsRepository } from './blogs/blogsRepository'
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
