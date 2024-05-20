import { Injectable } from '@nestjs/common'
import { BlogsRepository } from '../blogsRepository'

@Injectable()
export class DeleteBlogUseCase {
	constructor(private blogsRepository: BlogsRepository) {}

	async execute(blogId: string) {
		return this.blogsRepository.deleteBlog(blogId)
	}
}
