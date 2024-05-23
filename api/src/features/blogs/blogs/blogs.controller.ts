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
import { Request, Response } from 'express'
import { CheckAdminAuthGuard } from '../../../infrastructure/guards/checkAdminAuth.guard'
import RouteNames from '../../../settings/routeNames'
import { PostsQueryRepository } from '../posts/postsQueryRepository'
import { BlogsRepository } from './blogsRepository'
import { BlogsQueryRepository } from './blogsQueryRepository'
import {
	CreateBlogDtoModel,
	CreateBlogPostDtoModel,
	GetBlogPostsQueries,
	GetBlogPostsQueriesPipe,
	GetBlogsQueries,
	GetBlogsQueriesPipe,
	UpdateBlogDtoModel,
} from './model/blogs.input.model'
import { CreateBlogPostUseCase } from './use-cases/CreateBlogPostUseCase'
import { CreateBlogUseCase } from './use-cases/CreateBlogUseCase'
import { DeleteBlogUseCase } from './use-cases/DeleteBlogUseCase'
import { UpdateBlogUseCase } from './use-cases/UpdateBlogUseCase'

@Controller(RouteNames.BLOGS.value)
export class BlogsController {
	constructor(
		private deleteBlogUseCase: DeleteBlogUseCase,
		private updateBlogUseCase: UpdateBlogUseCase,
		private postsQueryRepository: PostsQueryRepository,
		private createBlogPostUseCase: CreateBlogPostUseCase,
		private blogsRepository: BlogsRepository,
		private createBlogUseCase: CreateBlogUseCase,
		private blogsQueryRepository: BlogsQueryRepository,
	) {}

	// Returns blogs with paging
	@Get()
	async getBlogs(@Query(new GetBlogsQueriesPipe()) query: GetBlogsQueries, @Res() res: Response) {
		const blogs = await this.blogsQueryRepository.getBlogs(query)
		res.status(HttpStatus.OK).send(blogs)
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
	@Get(':blogId/posts')
	async getBlogPosts(
		@Query(new GetBlogPostsQueriesPipe()) query: GetBlogPostsQueries,
		@Param('blogId') blogId: string,
		@Res() res: Response,
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

		res.status(HttpStatus.OK).send(posts)
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

		const createPostInsertedId = await this.createBlogPostUseCase.execute(+blogId, body)
		return await this.postsQueryRepository.getPost(user?.id, createPostInsertedId)
	}

	// Returns blog by id
	@Get(':blogId')
	async getBlog(@Param('blogId') blogId: string, @Res() res: Response) {
		const blog = await this.blogsQueryRepository.getBlog(blogId)

		if (!blog) {
			throw new NotFoundException()
		}

		res.status(HttpStatus.OK).send(blog)
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
}
