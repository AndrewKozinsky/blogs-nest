import { LikeStatuses } from '../../db/pg/entities/postLikes'
import { ItemsOutModel } from '../common'

export type CommentOutModel = {
	id: string
	content: string
	commentatorInfo: {
		userId: string
		userLogin: string
	}
	createdAt: string
	likesInfo: {
		likesCount: number
		dislikesCount: number
		myStatus: LikeStatuses
	}
}

export type GetCommentOutModel = CommentOutModel

export type GetPostCommentsOutModel = ItemsOutModel<CommentOutModel>
