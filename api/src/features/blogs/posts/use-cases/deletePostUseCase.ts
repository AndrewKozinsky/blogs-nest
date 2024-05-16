import { Injectable } from '@nestjs/common'
import { PostsMongoRepository } from '../posts.mongo.repository'

@Injectable()
export class DeletePostUseCase {
	constructor(private postsMongoRepository: PostsMongoRepository) {}

	async execute(postId: string): Promise<boolean> {
		return this.postsMongoRepository.deletePost(postId)
	}
}
