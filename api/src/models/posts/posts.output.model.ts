import { LikeStatuses } from '../../db/pg/entities/postLikes'
import { ItemsOutModel } from '../common'

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
		myStatus: LikeStatuses
		newestLikes: NewestLike[]
	}
}

export type NewestLike = {
	addedAt: string
	userId: string
	login: string
}

export type GetPostsOutModel = ItemsOutModel<PostOutModel>
export type GetPostOutModel = PostOutModel
