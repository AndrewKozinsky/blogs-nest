import { Injectable } from '@nestjs/common'
import { ObjectId } from 'mongodb'
import { CommentsRepository } from '../../comments/comments.repository'
import { UserServiceModel } from '../../users/models/users.service.model'
import { CreatePostCommentDtoModel, CreatePostDtoModel } from '../model/posts.input.model'
import { PostsRepository } from '../posts.repository'

@Injectable()
export class CreatePostCommentUseCase {
	constructor(
		private postsRepository: PostsRepository,
		private commentsRepository: CommentsRepository,
	) {}

	async execute(
		postId: string,
		commentDto: CreatePostCommentDtoModel,
		user: UserServiceModel,
	): Promise<'postNotExist' | string> {
		if (!ObjectId.isValid(postId)) {
			return 'postNotExist'
		}

		const post = await this.postsRepository.getPostById(postId)
		if (!post) return 'postNotExist'

		return await this.commentsRepository.createPostComment(user, postId, commentDto)
	}
}
