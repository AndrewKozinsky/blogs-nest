import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../../db/dbTypes'
import { BlogsMongoRepository } from '../../blogs/blogs.mongo.repository'
import { CreatePostDtoModel } from '../model/posts.input.model'
import { PostOutModel } from '../model/posts.output.model'
import { PostsMongoRepository } from '../posts.mongo.repository'

@Injectable()
export class DeletePostUseCase {
	constructor(private postsRepository: PostsMongoRepository) {}

	async execute(postId: string): Promise<boolean> {
		return this.postsRepository.deletePost(postId)
	}
}
