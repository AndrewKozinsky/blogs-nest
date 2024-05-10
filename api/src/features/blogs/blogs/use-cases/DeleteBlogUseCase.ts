import { Injectable } from '@nestjs/common'
import { BlogsMongoRepository } from '../blogs.mongo.repository'

@Injectable()
export class DeleteBlogUseCase {
	constructor(private blogsRepository: BlogsMongoRepository) {}

	async execute(blogId: string) {
		return this.blogsRepository.deleteBlog(blogId)
	}
}
