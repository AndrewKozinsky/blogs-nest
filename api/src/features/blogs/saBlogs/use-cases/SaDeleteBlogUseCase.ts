import { Injectable } from '@nestjs/common'
import { SaBlogsRepository } from '../saBlogsRepository'

@Injectable()
export class SaDeleteBlogUseCase {
	constructor(private saBlogsRepository: SaBlogsRepository) {}

	async execute(blogId: string) {
		return this.saBlogsRepository.deleteBlog(blogId)
	}
}
