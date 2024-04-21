import { Injectable } from '@nestjs/common'
import { BlogsRepository } from '../blogs.repository'
import { UpdateBlogDtoModel } from '../model/blogs.input.model'

@Injectable()
export class UpdateBlogUseCase {
	constructor(private blogsRepository: BlogsRepository) {}

	async execute(blogId: string, updateBlogDto: UpdateBlogDtoModel) {
		return this.blogsRepository.updateBlog(blogId, updateBlogDto)
	}
}
