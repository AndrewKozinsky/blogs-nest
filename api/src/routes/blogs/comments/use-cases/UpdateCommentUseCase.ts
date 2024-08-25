import { Injectable } from '@nestjs/common'
import { UserServiceModel } from '../../../../models/users/users.service.model'
import { CommentsRepository } from '../../../../repositories/comments.repository'
import { UpdateCommentDtoModel } from '../../../../models/comments/comments.input.model'

@Injectable()
export class UpdateCommentUseCase {
	constructor(private commentsRepository: CommentsRepository) {}

	async execute(
		user: UserServiceModel,
		commentId: string,
		updateCommentDto: UpdateCommentDtoModel,
	): Promise<'notOwner' | boolean> {
		const comment = await this.commentsRepository.getComment(commentId)
		if (!comment) return false

		if (comment.commentatorInfo.userId !== user.id) {
			return 'notOwner'
		}

		return this.commentsRepository.updateComment(commentId, updateCommentDto)
	}
}
