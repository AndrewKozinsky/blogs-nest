import { Injectable } from '@nestjs/common'
import { PostsService } from '../../posts/posts.service'
import { BlogsRepository } from '../blogs.repository'
import { CreateBlogDtoModel } from '../model/blogs.input.model'
import { CreateBlogOutModel } from '../model/blogs.output.model'

@Injectable()
export class CreateBlogUseCase {
	constructor(private blogsRepository: BlogsRepository) {}

	async execute(body: CreateBlogDtoModel) {
		const newBlog: CreateBlogOutModel = {
			id: new Date().toISOString(),
			name: body.name,
			description: body.description,
			websiteUrl: body.websiteUrl,
			createdAt: new Date().toISOString(),
			isMembership: false,
		}

		return await this.blogsRepository.createBlog(newBlog)
	}
}
