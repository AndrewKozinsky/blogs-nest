import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HashAdapter } from '../../base/adapters/hash.adapter'
import { Blog } from '../../db/pg/entities/blog'
import { DeviceToken } from '../../db/pg/entities/deviceToken'
import { Post } from '../../db/pg/entities/post'
import { PostLikes } from '../../db/pg/entities/postLikes'
import { User } from '../../db/pg/entities/user'
import { BlogsQueryRepository } from '../../repositories/blogs.queryRepository'
import { CommentLikesRepository } from '../../repositories/commentLikes.repository'
import { DeleteBlogPostUseCase } from './blogs/use-cases/deleteBlogPostUseCase'
import { UpdateBlogPostUseCase } from './blogs/use-cases/updateBlogPostUseCase'
import { CommentsController } from './comments/comments.controller'
import { CommentsQueryRepository } from '../../repositories/comments.queryRepository'
import { CommentsRepository } from '../../repositories/comments.repository'
import { CommonService } from '../common/common.service'
import { PostLikesRepository } from '../../repositories/postLikes.repository'
import { DeleteCommentUseCase } from './comments/use-cases/DeleteCommentUseCase'
import { SetCommentLikeStatusUseCase } from './comments/use-cases/SetCommentLikeStatusUseCase'
import { UpdateCommentUseCase } from './comments/use-cases/UpdateCommentUseCase'
import { BlogIdValidation } from '../../models/posts/posts.input.model'
import { PostsController } from './posts/posts.controller'
import { PostsQueryRepository } from '../../repositories/posts.queryRepository'
import { PostsRepository } from '../../repositories/posts.repository'
import { CreatePostCommentUseCase } from './posts/use-cases/createPostCommentUseCase'
import { CreatePostUseCase } from './posts/use-cases/createPostUseCase'
import { UsersRepository } from '../../repositories/users.repository'
import { BlogsController } from './blogs/blogs.controller'
import { BlogsRepository } from '../../repositories/blogs.repository'
import { CreateBlogPostUseCase } from './blogs/use-cases/CreateBlogPostUseCase'
import { CreateBlogUseCase } from './blogs/use-cases/CreateBlogUseCase'
import { DeleteBlogUseCase } from './blogs/use-cases/DeleteBlogUseCase'
import { UpdateBlogUseCase } from './blogs/use-cases/UpdateBlogUseCase'
import { DeletePostUseCase } from './posts/use-cases/deletePostUseCase'
import { SetPostLikeStatusUseCase } from './posts/use-cases/setPostLikeStatusUseCase'
import { UpdatePostUseCase } from './posts/use-cases/updatePostUseCase'
import { SaBlogsController } from './saBlogs/saBlogs.controller'

const useCases = [
	UpdateBlogPostUseCase,
	DeleteBlogPostUseCase,
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
	imports: [TypeOrmModule.forFeature([Blog, Post, User, PostLikes, DeviceToken])],
	controllers: [SaBlogsController, BlogsController, PostsController, CommentsController],
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
