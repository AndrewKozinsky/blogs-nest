import { DBTypes } from '../../../../db/mongo/dbTypes'
import { ItemsOutModel } from '../../../common/models/common'

export type PostOutModel = {
	id: string
	title: string
	shortDescription: string
	content: string
	blogId: string
	blogName: string
	createdAt: string
	extendedLikesInfo: {
		likesCount: number
		dislikesCount: number
		myStatus: DBTypes.LikeStatuses
		newestLikes: NewestLike[]
	}
}

export type NewestLike = {
	addedAt: string
	userId: string
	login: string
}

export type GetPostsOutModel = ItemsOutModel<PostOutModel>

export type CreatePostOutModel = PostOutModel

export type GetPostOutModel = PostOutModel
