import { DBTypes } from '../../../../db/mongo/dbTypes'
import { ItemsOutModel } from '../../../common/models/common'

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
		myStatus: DBTypes.LikeStatuses
	}
}

export type GetCommentOutModel = CommentOutModel

export type GetPostCommentsOutModel = ItemsOutModel<CommentOutModel>
