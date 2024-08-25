import { Injectable } from '@nestjs/common'
import { PostsRepository } from '../../../../repositories/posts.repository'

@Injectable()
export class DeletePostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(postId: string): Promise<boolean> {
		return this.postsRepository.deletePost(postId)
	}
}
