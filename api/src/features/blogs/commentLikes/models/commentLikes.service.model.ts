import { DBTypes } from '../../../../db/mongo/dbTypes'

export type CommentLikeServiceModel = {
	commentId: string
	userId: string
	status: DBTypes.LikeStatuses
}
