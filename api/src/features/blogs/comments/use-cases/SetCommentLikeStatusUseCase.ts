import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../../db/dbTypes'
import { LayerResult, LayerResultCode } from '../../../../types/resultCodes'
import { CommentLikesMongoRepository } from '../../commentLikes/CommentLikes.mongo.repository'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { CommentsMongoRepository } from '../comments.mongo.repository'
import { UpdateCommentDtoModel } from '../model/comments.input.model'

@Injectable()
export class SetCommentLikeStatusUseCase {
	constructor(
		private commentsRepository: CommentsMongoRepository,
		private commentLikesRepository: CommentLikesMongoRepository,
	) {}

	async execute(
		user: UserServiceModel,
		commentId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<LayerResult<null>> {
		const comment = await this.commentsRepository.getComment(commentId)
		if (!comment) {
			return {
				code: LayerResultCode.NotFound,
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
			code: LayerResultCode.Success,
		}
	}
}
