import { Injectable } from '@nestjs/common'
import { SaBlogsRepository } from '../saBlogsRepository'
import { CreateBlogDtoModel } from '../model/blogs.input.model'
import { CreateBlogOutModel } from '../model/blogs.output.model'

@Injectable()
export class SaCreateBlogUseCase {
	constructor(private saBlogsRepository: SaBlogsRepository) {}

	async execute(body: CreateBlogDtoModel) {
		const newBlog: CreateBlogOutModel = {
			id: new Date().toISOString(),
			name: body.name,
			description: body.description,
			websiteUrl: body.websiteUrl,
			createdAt: new Date().toISOString(),
			isMembership: false,
		}

		return await this.saBlogsRepository.createBlog(newBlog)
	}
}
