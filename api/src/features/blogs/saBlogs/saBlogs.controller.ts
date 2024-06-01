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
import { BlogsQueryRepository } from '../blogs/blogsQueryRepository'
import { DeleteBlogPostUseCase } from '../blogs/use-cases/deleteBlogPostUseCase'
import { UpdateBlogPostUseCase } from '../blogs/use-cases/updateBlogPostUseCase'
import { PostsQueryRepository } from '../posts/postsQueryRepository'
import { DeletePostUseCase } from '../posts/use-cases/deletePostUseCase'
import { SaBlogsRepository } from './saBlogsRepository'
import { SaBlogsQueryRepository } from './saBlogsQueryRepository'
import {
	CreateBlogDtoModel,
	CreateBlogPostDtoModel,
	GetBlogPostsQueries,
	GetBlogPostsQueriesPipe,
	GetBlogsQueries,
	GetBlogsQueriesPipe,
	UpdateBlogDtoModel,
	UpdateBlogPostDtoModel,
} from './model/blogs.input.model'
import { SaCreateBlogPostUseCase } from './use-cases/SaCreateBlogPostUseCase'
import { SaCreateBlogUseCase } from './use-cases/SaCreateBlogUseCase'
import { SaDeleteBlogPostUseCase } from './use-cases/saDeleteBlogPostUseCase'
import { SaDeleteBlogUseCase } from './use-cases/SaDeleteBlogUseCase'
import { SaUpdateBlogPostUseCase } from './use-cases/SaUpdateBlogPostUseCase'
import { SaUpdateBlogUseCase } from './use-cases/SaUpdateBlogUseCase'

@Controller(RouteNames.SA_BLOGS.value)
export class SaBlogsController {
	constructor(
		private saCreateBlogUseCase: SaCreateBlogUseCase,
		private blogsQueryRepository: BlogsQueryRepository,
		private saBlogsQueryRepository: SaBlogsQueryRepository,
		private saBlogsRepository: SaBlogsRepository,
		private saCreateBlogPostUseCase: SaCreateBlogPostUseCase,
		private postsQueryRepository: PostsQueryRepository,
		private saUpdateBlogUseCase: SaUpdateBlogUseCase,
		private saDeleteBlogUseCase: SaDeleteBlogUseCase,
		private saUpdateBlogPostUseCase: SaUpdateBlogPostUseCase,
		private saDeleteBlogPostUseCase: SaDeleteBlogPostUseCase,
	) {}

	// Returns blogs with paging
	@UseGuards(CheckAdminAuthGuard)
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
		const createdBlogId = await this.saCreateBlogUseCase.execute(body)
		return await this.saBlogsQueryRepository.getBlog(createdBlogId)
	}

	// Returns blog by id
	@Get(':blogId')
	async getBlog(@Param('blogId') blogId: string, @Res() res: Response) {
		const blog = await this.saBlogsQueryRepository.getBlog(blogId)

		if (!blog) {
			throw new NotFoundException()
		}

		res.status(HttpStatus.OK).send(blog)
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

		const blog = await this.saBlogsRepository.getBlogById(blogId)
		if (!blog) {
			throw new NotFoundException()
		}

		const posts = await this.saBlogsQueryRepository.getBlogPosts(user?.id, blogId, req.query)
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

		const blog = await this.saBlogsRepository.getBlogById(blogId)
		if (!blog) {
			throw new NotFoundException()
		}

		const createPostInsertedId = await this.saCreateBlogPostUseCase.execute(blogId, body)
		return await this.postsQueryRepository.getPost(user?.id, createPostInsertedId)
	}

	// Update existing Blog by id with InputModel
	@UseGuards(CheckAdminAuthGuard)
	@Put(':blogId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updateBlog(@Param('blogId') blogId: string, @Body() body: UpdateBlogDtoModel) {
		const isBlogUpdated = await this.saUpdateBlogUseCase.execute(blogId, body)

		if (!isBlogUpdated) {
			throw new NotFoundException()
		}
	}

	// Delete blog specified by id
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':blogId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteBlog(@Param('blogId') blogId: string) {
		const isBlogDeleted = await this.saDeleteBlogUseCase.execute(blogId)

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
		const isBlogPostUpdated = await this.saUpdateBlogPostUseCase.execute(blogId, postId, body)

		if (!isBlogPostUpdated) {
			throw new NotFoundException()
		}
	}

	// Delete blog post by id
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':blogId/posts/:postId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteBlogPost(@Param('blogId') blogId: string, @Param('postId') postId: string) {
		const isBlogPostDeleted = await this.saDeleteBlogPostUseCase.execute(blogId, postId)

		if (!isBlogPostDeleted) {
			throw new NotFoundException()
		}
	}
}
