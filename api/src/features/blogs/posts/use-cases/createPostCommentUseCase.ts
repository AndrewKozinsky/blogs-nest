import { Injectable } from '@nestjs/common'
import { ObjectId } from 'mongodb'
import { CommentsRepository } from '../../comments/commentsRepository'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { CreatePostCommentDtoModel } from '../model/posts.input.model'
import { PostsRepository } from '../postsRepository'

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
		const post = await this.postsRepository.getPostById(postId)
		if (!post) return 'postNotExist'

		return await this.commentsRepository.createPostComment(user, postId, commentDto)
	}
}
