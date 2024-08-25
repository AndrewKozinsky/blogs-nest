import { Injectable } from '@nestjs/common'
import { BlogsRepository } from '../../../../repositories/blogs.repository'

@Injectable()
export class DeleteBlogUseCase {
	constructor(private blogsRepository: BlogsRepository) {}

	async execute(blogId: string) {
		return this.blogsRepository.deleteBlog(blogId)
	}
}
