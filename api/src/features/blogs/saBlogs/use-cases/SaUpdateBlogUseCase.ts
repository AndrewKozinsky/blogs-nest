import { Injectable } from '@nestjs/common'
import { BlogsRepository } from '../../blogs/blogsRepository'
import { UpdateBlogDtoModel } from '../model/blogs.input.model'

@Injectable()
export class SaUpdateBlogUseCase {
	constructor(private blogsRepository: BlogsRepository) {}

	async execute(blogId: string, updateBlogDto: UpdateBlogDtoModel) {
		return this.blogsRepository.updateBlog(blogId, updateBlogDto)
	}
}
