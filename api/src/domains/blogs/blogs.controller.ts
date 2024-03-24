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
	async getBlogs(@Query() query: GetBlogsQueries, @Res() res: Response) {
		const blogs = await this.blogsQueryRepository.getBlogs(query)
		res.status(HttpStatus.OK).send(blogs)
	}

	@Post()
	async createNewBlog(@Body() body: CreateBlogDtoModel, @Res() res: Response) {
		const createdBlogId = await this.blogsService.createBlog(body)
		const createdBlog = await this.blogsQueryRepository.getBlog(createdBlogId)

		res.status(HttpStatus.CREATED).send(createdBlog)
	}

	@Get(':blogId/posts')
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

		res.status(HttpStatus.OK).send(posts)
	}

	@Post(':blogId/posts')
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

		res.status(HttpStatus.CREATED).send(createdPost)
	}

	@Get(':blogId')
	async getBlog(@Param('blogId') blogId: string, @Res() res: Response) {
		const blog = await this.blogsQueryRepository.getBlog(blogId)

		if (!blog) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		res.status(HttpStatus.OK).send(blog)
	}

	@Put(':blogId')
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

		res.sendStatus(HttpStatus.NO_CONTENT)
	}

	@Delete(':blogId')
	async deleteBlog(@Param('blogId') blogId: string, @Res() res: Response) {
		const isBlogDeleted = await this.blogsService.deleteBlog(blogId)

		if (!isBlogDeleted) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		res.sendStatus(HttpStatus.NO_CONTENT)
	}
}
