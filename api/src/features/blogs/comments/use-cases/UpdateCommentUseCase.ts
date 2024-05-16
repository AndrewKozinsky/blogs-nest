import { Injectable } from '@nestjs/common'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { CommentsMongoRepository } from '../comments.mongo.repository'
import { UpdateCommentDtoModel } from '../model/comments.input.model'

@Injectable()
export class UpdateCommentUseCase {
	constructor(private commentsMongoRepository: CommentsMongoRepository) {}

	async execute(
		user: UserServiceModel,
		commentId: string,
		updateCommentDto: UpdateCommentDtoModel,
	): Promise<'notOwner' | boolean> {
		const comment = await this.commentsMongoRepository.getComment(commentId)
		if (!comment) return false

		if (comment.commentatorInfo.userId !== user.id) {
			return 'notOwner'
		}

		return this.commentsMongoRepository.updateComment(commentId, updateCommentDto)
	}
}
