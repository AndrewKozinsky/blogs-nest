import { Injectable } from '@nestjs/common'
import { CreateBlogDtoModel } from '../../../../models/blogs/blogs.input.model'
import { CreateBlogOutModel } from '../../../../models/blogs/blogs.output.model'
import { BlogsRepository } from '../../../../repositories/blogs.repository'

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
