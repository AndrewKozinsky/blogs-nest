import { Injectable } from '@nestjs/common'
import { UpdatePostDtoModel } from '../model/posts.input.model'
import { PostsMongoRepository } from '../posts.mongo.repository'

@Injectable()
export class UpdatePostUseCase {
	constructor(private postsMongoRepository: PostsMongoRepository) {}

	async execute(postId: string, updatePostDto: UpdatePostDtoModel) {
		return this.postsMongoRepository.updatePost(postId, updatePostDto)
	}
}
