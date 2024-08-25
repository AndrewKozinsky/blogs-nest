import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	Put,
	Query,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common'
import { CheckAdminAuthGuard } from '../../../infrastructure/guards/checkAdminAuth.guard'
import {
	CreateBlogDtoModel,
	CreateBlogPostDtoModel,
	GetBlogPostsQueries,
	GetBlogPostsQueriesPipe,
	GetBlogsQueries,
	GetBlogsQueriesPipe,
	UpdateBlogDtoModel,
	UpdateBlogPostDtoModel,
} from '../../../models/blogs/blogs.input.model'
import { BlogsQueryRepository } from '../../../repositories/blogs.queryRepository'
import { BlogsRepository } from '../../../repositories/blogs.repository'
import { PostsQueryRepository } from '../../../repositories/posts.queryRepository'
import RouteNames from '../../../settings/routeNames'
import { CreateBlogPostUseCase } from '../../blogs/blogs/use-cases/CreateBlogPostUseCase'
import { CreateBlogUseCase } from '../../blogs/blogs/use-cases/CreateBlogUseCase'
import { Request } from 'express'
import { DeleteBlogPostUseCase } from '../../blogs/blogs/use-cases/deleteBlogPostUseCase'
import { DeleteBlogUseCase } from '../../blogs/blogs/use-cases/DeleteBlogUseCase'
import { UpdateBlogPostUseCase } from '../../blogs/blogs/use-cases/updateBlogPostUseCase'
import { UpdateBlogUseCase } from '../../blogs/blogs/use-cases/UpdateBlogUseCase'

@Controller(RouteNames.BLOGGER.BLOGS.full)
export class BloggerBlogsController {
	constructor(
		private deleteBlogUseCase: DeleteBlogUseCase,
		private updateBlogUseCase: UpdateBlogUseCase,
		private postsQueryRepository: PostsQueryRepository,
		private createBlogPostUseCase: CreateBlogPostUseCase,
		private blogsRepository: BlogsRepository,
		private createBlogUseCase: CreateBlogUseCase,
		private blogsQueryRepository: BlogsQueryRepository,
		private updateBlogPostUseCase: UpdateBlogPostUseCase,
		private deleteBlogPostUseCase: DeleteBlogPostUseCase,
	) {}

	// Returns all blogs with paging
	// GET /hometask_29/api/blogger/blogs
	@Get()
	@HttpCode(HttpStatus.OK)
	async getBlogs(@Query(new GetBlogsQueriesPipe()) query: GetBlogsQueries) {
		return await this.blogsQueryRepository.getBlogs(query)
	}

	// Create new blog
	@UseGuards(CheckAdminAuthGuard)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createNewBlog(@Body() body: CreateBlogDtoModel) {
		const createdBlogId = await this.createBlogUseCase.execute(body)
		return await this.blogsQueryRepository.getBlog(createdBlogId)
	}

	// Returns all posts for specified blog
	@HttpCode(HttpStatus.OK)
	@Get(':blogId/posts')
	async getBlogPosts(
		@Query(new GetBlogPostsQueriesPipe()) query: GetBlogPostsQueries,
		@Param('blogId') blogId: string,
		@Req() req: Request,
	) {
		const { user } = req

		const blog = await this.blogsRepository.getBlogById(blogId)
		if (!blog) {
			throw new NotFoundException()
		}

		const posts = await this.blogsQueryRepository.getBlogPosts(user?.id, blogId, query)

		if (!posts) {
			throw new NotFoundException()
		}

		return posts
	}

	// Create new post for specific blog
	@UseGuards(CheckAdminAuthGuard)
	@Post(':blogId/posts')
	@HttpCode(HttpStatus.CREATED)
	async createNewPostForSpecificBlog(
		@Param('blogId') blogId: string,
		@Body() body: CreateBlogPostDtoModel,
		@Req() req: Request,
	) {
		const { user } = req

		const blog = await this.blogsRepository.getBlogById(blogId)
		if (!blog) {
			throw new NotFoundException()
		}

		const createPostInsertedId = await this.createBlogPostUseCase.execute(blogId, body)
		return await this.postsQueryRepository.getPost(user?.id, createPostInsertedId)
	}

	// Update existing Blog by id with InputModel
	@UseGuards(CheckAdminAuthGuard)
	@Put(':blogId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updateBlog(@Param('blogId') blogId: string, @Body() body: UpdateBlogDtoModel) {
		const isBlogUpdated = await this.updateBlogUseCase.execute(blogId, body)

		if (!isBlogUpdated) {
			throw new NotFoundException()
		}
	}

	// Delete blog specified by id
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':blogId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteBlog(@Param('blogId') blogId: string) {
		const isBlogDeleted = await this.deleteBlogUseCase.execute(blogId)

		if (!isBlogDeleted) {
			throw new NotFoundException()
		}
	}

	// Update existing post by id with InputModel
	@Put(':blogId' + '/' + RouteNames.BLOGGER.BLOGS.BLOG_ID('').POSTS('').value + '/:postId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updateBlogPost(
		@Body() body: UpdateBlogPostDtoModel,
		@Param('postId') blogId: string,
		@Param('blogId') postId: string,
	) {
		const isBlogPostUpdated = await this.updateBlogPostUseCase.execute(blogId, postId, body)

		if (!isBlogPostUpdated) {
			throw new NotFoundException()
		}
	}

	@Delete(':blogId' + '/' + RouteNames.BLOGGER.BLOGS.BLOG_ID('').POSTS('').value + '/:postId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteBlogPost(@Param('postId') blogId: string, @Param('blogId') postId: string) {
		const isBlogPostDeleted = await this.deleteBlogPostUseCase.execute(blogId, postId)

		if (!isBlogPostDeleted) {
			throw new NotFoundException()
		}
	}
}
