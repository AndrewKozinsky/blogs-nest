import { Injectable } from '@nestjs/common'
import { CreatePostDtoModel } from '../../../../models/posts/posts.input.model'
import { PostsRepository } from '../../../../repositories/posts.repository'

@Injectable()
export class CreatePostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(dto: CreatePostDtoModel): Promise<string> {
		return await this.postsRepository.createPost(dto)
	}
}
