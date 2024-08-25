import { LikeStatuses } from '../../db/pg/entities/postLikes'

export type CommentLikeServiceModel = {
	commentId: string
	userId: string
	status: LikeStatuses
}
