import { Injectable } from '@nestjs/common'
import { BlogsMongoRepository } from '../blogs.mongo.repository'
import { UpdateBlogDtoModel } from '../model/blogs.input.model'

@Injectable()
export class UpdateBlogUseCase {
	constructor(private blogsRepository: BlogsMongoRepository) {}

	async execute(blogId: string, updateBlogDto: UpdateBlogDtoModel) {
		return this.blogsRepository.updateBlog(blogId, updateBlogDto)
	}
}
