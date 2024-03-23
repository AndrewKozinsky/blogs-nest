import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Put,
	Query,
	Req,
	Res,
} from '@nestjs/common'
import { Request, Response } from 'express'
import RouteNames from '../../config/routeNames'
import { PostsQueryRepository } from '../posts/posts.queryRepository'
import { BlogsQueryRepository } from './blogs.queryRepository'
import { BlogsRepository } from './blogs.repository'
import { BlogsService } from './blogs.service'
import {
	CreateBlogDtoModel,
	CreateBlogPostDtoModel,
	GetBlogPostsQueries,
	GetBlogsQueries,
	UpdateBlogDtoModel,
} from './model/blogs.input.model'

@Controller(RouteNames.blogs)
export class BlogsController {
	constructor(
		private blogsService: BlogsService,
		private blogsRepository: BlogsRepository,
		private blogsQueryRepository: BlogsQueryRepository,
		private postsQueryRepository: PostsQueryRepository,
	) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	async getBlogs(@Query() query: GetBlogsQueries) {
		const blogs = await this.blogsQueryRepository.getBlogs(query)
		return blogs
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createNewBlog(@Body() body: CreateBlogDtoModel) {
		const createdBlogId = await this.blogsService.createBlog(body)
		const createdBlog = await this.blogsQueryRepository.getBlog(createdBlogId)

		return createdBlog
	}

	@Get(':blogId/posts')
	@HttpCode(HttpStatus.OK)
	async getBlogPosts(@Param('blogId') blogId: string, @Res() res: Response, @Req() req: Request) {
		const { user } = req

		const blog = await this.blogsRepository.getBlogById(blogId)
		if (!blog) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		const posts = await this.blogsQueryRepository.getBlogPosts(user?.id, blogId, req.query)

		if (!posts) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		return posts
	}

	@Post(':blogId/posts')
	@HttpCode(HttpStatus.CREATED)
	async createNewPostForSpecificBlog(
		@Param('blogId') blogId: string,
		@Body() body: CreateBlogPostDtoModel,
		@Res() res: Response,
		@Req() req: Request,
	) {
		const { user } = req

		const blog = await this.blogsRepository.getBlogById(blogId)

		if (!blog) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		const createPostInsertedId = await this.blogsService.createBlogPost(blogId, body)

		const createdPost = await this.postsQueryRepository.getPost(user?.id, createPostInsertedId)

		return createdPost
	}

	@Get(':blogId')
	@HttpCode(HttpStatus.OK)
	async getBlog(@Param('blogId') blogId: string, @Res() res: Response) {
		const blog = await this.blogsQueryRepository.getBlog(blogId)

		if (!blog) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		res.send(blog)
	}

	@Put(':blogId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updateBlog(
		@Param('blogId') blogId: string,
		@Body() body: UpdateBlogDtoModel,
		@Res() res: Response,
	) {
		const isBlogUpdated = await this.blogsService.updateBlog(blogId, body)

		if (!isBlogUpdated) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}
	}

	@Delete(':blogId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteBlog(@Param('blogId') blogId: string, @Res() res: Response) {
		const isBlogDeleted = await this.blogsService.deleteBlog(blogId)

		if (!isBlogDeleted) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}
	}
}
