import { Injectable } from '@nestjs/common'
import { LikeStatuses } from '../../../../db/pg/entities/postLikes'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../../types/resultCodes'
import { CommentLikesRepository } from '../../../../repositories/commentLikes.repository'
import { UserServiceModel } from '../../../../models/users/users.service.model'
import { CommentsRepository } from '../../../../repositories/comments.repository'

@Injectable()
export class SetCommentLikeStatusUseCase {
	constructor(
		private commentsRepository: CommentsRepository,
		private commentLikesRepository: CommentLikesRepository,
	) {}

	async execute(
		user: UserServiceModel,
		commentId: string,
		likeStatus: LikeStatuses,
	): Promise<LayerResult<null>> {
		const comment = await this.commentsRepository.getComment(commentId)
		if (!comment) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		// Find comment like status object if it exists
		const commentLike = await this.commentLikesRepository.getCommentLikeByUser(
			user.id,
			commentId,
		)

		if (commentLike) {
			await this.commentLikesRepository.updateCommentLike(user.id, commentId, likeStatus)
		} else {
			await this.commentLikesRepository.createCommentLike(user.id, commentId, likeStatus)
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}
}
