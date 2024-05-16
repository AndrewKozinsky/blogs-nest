import { Injectable } from '@nestjs/common'
import { ObjectId } from 'mongodb'
import { CommentsMongoRepository } from '../../comments/comments.mongo.repository'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { CreatePostCommentDtoModel } from '../model/posts.input.model'
import { PostsMongoRepository } from '../posts.mongo.repository'

@Injectable()
export class CreatePostCommentUseCase {
	constructor(
		private postsMongoRepository: PostsMongoRepository,
		private commentsMongoRepository: CommentsMongoRepository,
	) {}

	async execute(
		postId: string,
		commentDto: CreatePostCommentDtoModel,
		user: UserServiceModel,
	): Promise<'postNotExist' | string> {
		if (!ObjectId.isValid(postId)) {
			return 'postNotExist'
		}

		const post = await this.postsMongoRepository.getPostById(postId)
		if (!post) return 'postNotExist'

		return await this.commentsMongoRepository.createPostComment(user, postId, commentDto)
	}
}
