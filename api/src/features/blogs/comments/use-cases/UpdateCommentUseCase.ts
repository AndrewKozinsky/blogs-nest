import { Injectable } from '@nestjs/common'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { CommentsRepository } from '../comments.repository'
import { UpdateCommentDtoModel } from '../model/comments.input.model'

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
