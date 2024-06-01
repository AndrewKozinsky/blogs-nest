import { Injectable } from '@nestjs/common'
import { SaBlogsRepository } from '../saBlogsRepository'
import { UpdateBlogDtoModel } from '../model/blogs.input.model'

@Injectable()
export class SaUpdateBlogUseCase {
	constructor(private saBlogsRepository: SaBlogsRepository) {}

	async execute(blogId: string, updateBlogDto: UpdateBlogDtoModel) {
		return this.saBlogsRepository.updateBlog(blogId, updateBlogDto)
	}
}
