import { Injectable } from '@nestjs/common'
import { PostsRepository } from '../postsRepository'

@Injectable()
export class DeletePostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(postId: string): Promise<boolean> {
		return this.postsRepository.deletePost(postId)
	}
}
