import { Injectable } from '@nestjs/common'
import { PostsMongoRepository } from '../posts.mongo.repository'

@Injectable()
export class DeletePostUseCase {
	constructor(private postsRepository: PostsMongoRepository) {}

	async execute(postId: string): Promise<boolean> {
		return this.postsRepository.deletePost(postId)
	}
}
