import { Injectable } from '@nestjs/common'
import { UpdateBlogDtoModel } from '../../../../models/blogs/blogs.input.model'
import { BlogsRepository } from '../../../../repositories/blogs.repository'

@Injectable()
export class UpdateBlogUseCase {
	constructor(private blogsRepository: BlogsRepository) {}

	async execute(blogId: string, updateBlogDto: UpdateBlogDtoModel) {
		return this.blogsRepository.updateBlog(blogId, updateBlogDto)
	}
}
