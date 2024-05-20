import { Injectable } from '@nestjs/common'
import { UpdatePostDtoModel } from '../model/posts.input.model'
import { PostsRepository } from '../postsRepository'

@Injectable()
export class UpdatePostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(postId: string, updatePostDto: UpdatePostDtoModel) {
		return this.postsRepository.updatePost(postId, updatePostDto)
	}
}
