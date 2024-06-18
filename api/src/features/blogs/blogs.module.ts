import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { Blog } from '../../db/pg/entities/blog'
import { Post } from '../../db/pg/entities/post'
import { PostLikes } from '../../db/pg/entities/postLikes'
import { User } from '../../db/pg/entities/user'
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
import { SaBlogsController } from './saBlogs/saBlogs.controller'
import { SaBlogsQueryRepository } from './saBlogs/saBlogsQueryRepository'
import { SaBlogsRepository } from './saBlogs/saBlogsRepository'
import { SaCreateBlogPostUseCase } from './saBlogs/use-cases/SaCreateBlogPostUseCase'
import { SaCreateBlogUseCase } from './saBlogs/use-cases/SaCreateBlogUseCase'
import { SaDeleteBlogPostUseCase } from './saBlogs/use-cases/saDeleteBlogPostUseCase'
import { SaDeleteBlogUseCase } from './saBlogs/use-cases/SaDeleteBlogUseCase'
import { SaUpdateBlogPostUseCase } from './saBlogs/use-cases/SaUpdateBlogPostUseCase'
import { SaUpdateBlogUseCase } from './saBlogs/use-cases/SaUpdateBlogUseCase'

const useCases = [
	SaCreateBlogUseCase,
	SaCreateBlogPostUseCase,
	SaUpdateBlogUseCase,
	SaDeleteBlogUseCase,
	SaUpdateBlogPostUseCase,
	SaDeleteBlogPostUseCase,

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
	imports: [TypeOrmModule.forFeature([Blog, Post, User, PostLikes])],
	controllers: [SaBlogsController, BlogsController, PostsController, CommentsController],
	providers: [
		SaBlogsQueryRepository,
		BlogsQueryRepository,
		SaBlogsRepository,
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
