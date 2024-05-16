import { Injectable } from '@nestjs/common'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { CommentsMongoRepository } from '../comments.mongo.repository'

@Injectable()
export class DeleteCommentUseCase {
	constructor(private commentsMongoRepository: CommentsMongoRepository) {}

	async execute(user: UserServiceModel, commentId: string): Promise<'notOwner' | boolean> {
		const comment = await this.commentsMongoRepository.getComment(commentId)
		if (!comment) return false

		if (comment.commentatorInfo.userId !== user.id) {
			return 'notOwner'
		}

		return this.commentsMongoRepository.deleteComment(commentId)
	}
}
