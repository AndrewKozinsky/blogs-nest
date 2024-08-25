import { Injectable } from '@nestjs/common'
import { UserServiceModel } from '../../../../models/users/users.service.model'
import { CommentsRepository } from '../../../../repositories/comments.repository'

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
