import { Injectable } from '@nestjs/common'
import { CommentLikesMongoRepository } from '../../commentLikes/CommentLikes.mongo.repository'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { CommentsMongoRepository } from '../comments.mongo.repository'
import { UpdateCommentDtoModel } from '../model/comments.input.model'

@Injectable()
export class DeleteCommentUseCase {
	constructor(private commentsRepository: CommentsMongoRepository) {}

	async execute(user: UserServiceModel, commentId: string): Promise<'notOwner' | boolean> {
		const comment = await this.commentsRepository.getComment(commentId)
		if (!comment) return false

		if (comment.commentatorInfo.userId !== user.id) {
			return 'notOwner'
		}

		return this.commentsRepository.deleteComment(commentId)
	}
}
