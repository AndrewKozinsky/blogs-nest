import { DBTypes } from '../../../../db/mongo/dbTypes'

export type PostLikeServiceModel = {
	postId: string
	userId: string
	status: DBTypes.LikeStatuses
}
