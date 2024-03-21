import { Injectable } from '@nestjs/common'
import { CreatePostDtoModel } from '../posts/model/posts.input.model'
import { PostsService } from '../posts/posts.service'
import { BlogsRepository } from './blogs.repository'
import {
	CreateBlogDtoModel,
	CreateBlogPostDtoModel,
	UpdateBlogDtoModel,
} from './model/blogs.input.model'
import { CreateBlogOutModel } from './model/blogs.output.model'

@Injectable()
export class BlogsService {
	constructor(
		private blogsRepository: BlogsRepository,
		private postsService: PostsService,
	) {}

	async createBlog(dto: CreateBlogDtoModel) {
		const newBlog: CreateBlogOutModel = {
			id: new Date().toISOString(),
			name: dto.name,
			description: dto.description,
			websiteUrl: dto.websiteUrl,
			createdAt: new Date().toISOString(),
			isMembership: false,
		}

		return await this.blogsRepository.createBlog(newBlog)
	}

	async createBlogPost(blogId: string, postDto: CreateBlogPostDtoModel) {
		const newPostDto: CreatePostDtoModel = { blogId, ...postDto }
		return this.postsService.createPost(newPostDto)
	}

	async updateBlog(blogId: string, updateBlogDto: UpdateBlogDtoModel) {
		return this.blogsRepository.updateBlog(blogId, updateBlogDto)
	}

	async deleteBlog(blogId: string): Promise<boolean> {
		return this.blogsRepository.deleteBlog(blogId)
	}
}
