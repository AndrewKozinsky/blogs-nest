import { Injectable } from '@nestjs/common'
import { CreatePostDtoModel } from '../model/posts.input.model'
import { PostsRepository } from '../postsRepository'

@Injectable()
export class CreatePostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(dto: CreatePostDtoModel): Promise<string> {
		return await this.postsRepository.createPost(dto)
	}
}
