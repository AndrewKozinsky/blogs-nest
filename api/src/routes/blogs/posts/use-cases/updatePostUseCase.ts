import { Injectable } from '@nestjs/common'
import { UpdatePostDtoModel } from '../../../../models/posts/posts.input.model'
import { PostsRepository } from '../../../../repositories/posts.repository'

@Injectable()
export class UpdatePostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(postId: string, updatePostDto: UpdatePostDtoModel) {
		return this.postsRepository.updatePost(postId, updatePostDto)
	}
}
