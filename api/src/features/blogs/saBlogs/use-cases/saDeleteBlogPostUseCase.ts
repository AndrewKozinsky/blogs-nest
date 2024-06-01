import { Injectable } from '@nestjs/common'
import { PostsRepository } from '../../posts/postsRepository'

@Injectable()
export class SaDeleteBlogPostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(blogId: string, postId: string): Promise<boolean> {
		return this.postsRepository.deleteBlogPost(blogId, postId)
	}
}
