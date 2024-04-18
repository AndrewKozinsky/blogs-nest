import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../db/dbTypes'
import { BlogsRepository } from '../../blogs/blogs.repository'
import { CreatePostDtoModel } from '../model/posts.input.model'
import { PostOutModel } from '../model/posts.output.model'
import { PostsRepository } from '../posts.repository'

@Injectable()
export class DeletePostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(postId: string): Promise<boolean> {
		return this.postsRepository.deletePost(postId)
	}
}
