import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../../db/dbTypes'
import { BlogsMongoRepository } from '../../blogs/blogs.mongo.repository'
import { CreatePostDtoModel, UpdatePostDtoModel } from '../model/posts.input.model'
import { PostOutModel } from '../model/posts.output.model'
import { PostsMongoRepository } from '../posts.mongo.repository'

@Injectable()
export class UpdatePostUseCase {
	constructor(private postsRepository: PostsMongoRepository) {}

	async execute(postId: string, updatePostDto: UpdatePostDtoModel) {
		return this.postsRepository.updatePost(postId, updatePostDto)
	}
}
