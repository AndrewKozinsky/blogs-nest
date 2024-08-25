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
	UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { CheckAdminAuthGuard } from '../../../infrastructure/guards/checkAdminAuth.guard'
import RouteNames from '../../../settings/routeNames'
import { BlogsRepository } from '../../../repositories/blogs.repository'
import { PostsQueryRepository } from '../../../repositories/posts.queryRepository'
import { BlogsQueryRepository } from '../../../repositories/blogs.queryRepository'
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
import { CreateBlogPostUseCase } from '../blogs/use-cases/CreateBlogPostUseCase'
import { CreateBlogUseCase } from '../blogs/use-cases/CreateBlogUseCase'
import { DeleteBlogPostUseCase } from '../blogs/use-cases/deleteBlogPostUseCase'
import { DeleteBlogUseCase } from '../blogs/use-cases/DeleteBlogUseCase'
import { UpdateBlogPostUseCase } from '../blogs/use-cases/updateBlogPostUseCase'
import { UpdateBlogUseCase } from '../blogs/use-cases/UpdateBlogUseCase'

@Controller(RouteNames.SA_BLOGS.value)
export class SaBlogsController {
	constructor(
		private saCreateBlogUseCase: CreateBlogUseCase,
		private blogsQueryRepository: BlogsQueryRepository,
		private blogsRepository: BlogsRepository,
		private createBlogPostUseCase: CreateBlogPostUseCase,
		private postsQueryRepository: PostsQueryRepository,
		private updateBlogUseCase: UpdateBlogUseCase,
		private deleteBlogUseCase: DeleteBlogUseCase,
		private updateBlogPostUseCase: UpdateBlogPostUseCase,
		private deleteBlogPostUseCase: DeleteBlogPostUseCase,
	) {}

	// Returns blogs with paging
	@UseGuards(CheckAdminAuthGuard)
	@Get()
	@HttpCode(HttpStatus.OK)
	async getBlogs(@Query(new GetBlogsQueriesPipe()) query: GetBlogsQueries) {
		const blogs = await this.blogsQueryRepository.getBlogs(query)
		return blogs
	}

	// Create new blog
	@UseGuards(CheckAdminAuthGuard)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createNewBlog(@Body() body: CreateBlogDtoModel) {
		const createdBlogId = await this.saCreateBlogUseCase.execute(body)
		return await this.blogsQueryRepository.getBlog(createdBlogId)
	}

	// Returns blog by id
	@Get(':blogId')
	@HttpCode(HttpStatus.OK)
	async getBlog(@Param('blogId') blogId: string) {
		const blog = await this.blogsQueryRepository.getBlog(blogId)

		if (!blog) {
			throw new NotFoundException()
		}

		return blog
	}

	// Returns all posts for specified blog
	@Get(':blogId/posts')
	@HttpCode(HttpStatus.OK)
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

		const posts = await this.blogsQueryRepository.getBlogPosts(user?.id, blogId, req.query)

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

	// Update existing blog post by id with InputModel
	@UseGuards(CheckAdminAuthGuard)
	@Put(':blogId/posts/:postId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updateBlogPost(
		@Param('blogId') blogId: string,
		@Param('postId') postId: string,
		@Body() body: UpdateBlogPostDtoModel,
	) {
		const isBlogPostUpdated = await this.updateBlogPostUseCase.execute(blogId, postId, body)

		if (!isBlogPostUpdated) {
			throw new NotFoundException()
		}
	}

	// Delete blog post by id
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':blogId/posts/:postId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteBlogPost(@Param('blogId') blogId: string, @Param('postId') postId: string) {
		const isBlogPostDeleted = await this.deleteBlogPostUseCase.execute(blogId, postId)

		if (!isBlogPostDeleted) {
			throw new NotFoundException()
		}
	}
}
