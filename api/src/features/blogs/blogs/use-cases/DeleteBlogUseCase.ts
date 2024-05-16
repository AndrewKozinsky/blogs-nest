import { Injectable } from '@nestjs/common'
import { BlogsRepository } from '../blogsRepository'

@Injectable()
export class DeleteBlogUseCase {
	constructor(private blogsMongoRepository: BlogsRepository) {}

	async execute(blogId: string) {
		return this.blogsMongoRepository.deleteBlog(blogId)
	}
}
