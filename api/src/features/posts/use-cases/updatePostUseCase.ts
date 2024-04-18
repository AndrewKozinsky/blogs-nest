import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../db/dbTypes'
import { BlogsRepository } from '../../blogs/blogs.repository'
import { CreatePostDtoModel, UpdatePostDtoModel } from '../model/posts.input.model'
import { PostOutModel } from '../model/posts.output.model'
import { PostsRepository } from '../posts.repository'

@Injectable()
export class UpdatePostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(postId: string, updatePostDto: UpdatePostDtoModel) {
		return this.postsRepository.updatePost(postId, updatePostDto)
	}
}
