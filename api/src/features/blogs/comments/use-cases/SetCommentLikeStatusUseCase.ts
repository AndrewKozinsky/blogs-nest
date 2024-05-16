import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../../db/mongo/dbTypes'
import { LayerResult, LayerResultCode } from '../../../../types/resultCodes'
import { CommentLikesMongoRepository } from '../../commentLikes/CommentLikes.mongo.repository'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { CommentsMongoRepository } from '../comments.mongo.repository'

@Injectable()
export class SetCommentLikeStatusUseCase {
	constructor(
		private commentsMongoRepository: CommentsMongoRepository,
		private commentLikesMongoRepository: CommentLikesMongoRepository,
	) {}

	async execute(
		user: UserServiceModel,
		commentId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<LayerResult<null>> {
		const comment = await this.commentsMongoRepository.getComment(commentId)
		if (!comment) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		// Find comment like status object if it exists
		const commentLike = await this.commentLikesMongoRepository.getCommentLikeByUser(
			user.id,
			commentId,
		)

		if (commentLike) {
			await this.commentLikesMongoRepository.updateCommentLike(user.id, commentId, likeStatus)
		} else {
			await this.commentLikesMongoRepository.createCommentLike(user.id, commentId, likeStatus)
		}

		return {
			code: LayerResultCode.Success,
		}
	}
}
