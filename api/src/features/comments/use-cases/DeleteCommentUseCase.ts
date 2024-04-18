import { Injectable } from '@nestjs/common'
import { CommentLikesRepository } from '../../commentLikes/CommentLikes.repository'
import { UserServiceModel } from '../../users/models/users.service.model'
import { CommentsRepository } from '../comments.repository'
import { UpdateCommentDtoModel } from '../model/comments.input.model'

@Injectable()
export class DeleteCommentUseCase {
	constructor(private commentsRepository: CommentsRepository) {}

	async execute(user: UserServiceModel, commentId: string): Promise<'notOwner' | boolean> {
		const comment = await this.commentsRepository.getComment(commentId)
		if (!comment) return false

		if (comment.commentatorInfo.userId !== user.id) {
			return 'notOwner'
		}

		return this.commentsRepository.deleteComment(commentId)
	}
}
