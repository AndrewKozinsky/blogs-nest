import { Injectable } from '@nestjs/common'
import { BlogsRepository } from '../blogsRepository'
import { UpdateBlogDtoModel } from '../model/blogs.input.model'

@Injectable()
export class UpdateBlogUseCase {
	constructor(private blogsMongoRepository: BlogsRepository) {}

	async execute(blogId: string, updateBlogDto: UpdateBlogDtoModel) {
		return this.blogsMongoRepository.updateBlog(blogId, updateBlogDto)
	}
}
