import { LikeStatuses } from '../../db/pg/entities/postLikes'

export type PostLikeServiceModel = {
	postId: string
	userId: string
	status: LikeStatuses
}
