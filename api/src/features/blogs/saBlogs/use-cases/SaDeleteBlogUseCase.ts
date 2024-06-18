import { Injectable } from '@nestjs/common'
import { BlogsRepository } from '../../blogs/blogsRepository'
import { SaBlogsRepository } from '../saBlogsRepository'

@Injectable()
export class SaDeleteBlogUseCase {
	constructor(private blogsRepository: BlogsRepository) {}

	async execute(blogId: string) {
		return this.blogsRepository.deleteBlog(blogId)
	}
}
