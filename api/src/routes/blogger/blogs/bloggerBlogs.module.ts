import { Module, Post } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HashAdapter } from '../../../base/adapters/hash.adapter'
import { Blog } from '../../../db/pg/entities/blog'
import { DeviceToken } from '../../../db/pg/entities/deviceToken'
import { PostLikes } from '../../../db/pg/entities/postLikes'
import { User } from '../../../db/pg/entities/user'
import { BlogIdValidation } from '../../../models/posts/posts.input.model'
import { BlogsQueryRepository } from '../../../repositories/blogs.queryRepository'
import { BlogsRepository } from '../../../repositories/blogs.repository'
import { CommentLikesRepository } from '../../../repositories/commentLikes.repository'
import { CommentsQueryRepository } from '../../../repositories/comments.queryRepository'
import { CommentsRepository } from '../../../repositories/comments.repository'
import { PostLikesRepository } from '../../../repositories/postLikes.repository'
import { PostsQueryRepository } from '../../../repositories/posts.queryRepository'
import { PostsRepository } from '../../../repositories/posts.repository'
import { UsersRepository } from '../../../repositories/users.repository'
import { BlogsController } from '../../blogs/blogs/blogs.controller'
import { CreateBlogPostUseCase } from '../../blogs/blogs/use-cases/CreateBlogPostUseCase'
import { CreateBlogUseCase } from '../../blogs/blogs/use-cases/CreateBlogUseCase'
import { DeleteBlogPostUseCase } from '../../blogs/blogs/use-cases/deleteBlogPostUseCase'
import { DeleteBlogUseCase } from '../../blogs/blogs/use-cases/DeleteBlogUseCase'
import { UpdateBlogPostUseCase } from '../../blogs/blogs/use-cases/updateBlogPostUseCase'
import { UpdateBlogUseCase } from '../../blogs/blogs/use-cases/UpdateBlogUseCase'
import { CommentsController } from '../../blogs/comments/comments.controller'
import { DeleteCommentUseCase } from '../../blogs/comments/use-cases/DeleteCommentUseCase'
import { SetCommentLikeStatusUseCase } from '../../blogs/comments/use-cases/SetCommentLikeStatusUseCase'
import { UpdateCommentUseCase } from '../../blogs/comments/use-cases/UpdateCommentUseCase'
import { PostsController } from '../../blogs/posts/posts.controller'
import { CreatePostCommentUseCase } from '../../blogs/posts/use-cases/createPostCommentUseCase'
import { CreatePostUseCase } from '../../blogs/posts/use-cases/createPostUseCase'
import { DeletePostUseCase } from '../../blogs/posts/use-cases/deletePostUseCase'
import { SetPostLikeStatusUseCase } from '../../blogs/posts/use-cases/setPostLikeStatusUseCase'
import { UpdatePostUseCase } from '../../blogs/posts/use-cases/updatePostUseCase'
import { SaBlogsController } from '../../blogs/saBlogs/saBlogs.controller'
import { CommonService } from '../../common/common.service'

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
export class BloggerBlogsModule {}
