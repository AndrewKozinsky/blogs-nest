import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { PostLike, PostLikeDocument } from '../../../db/mongo/schemas/postLike.schema'
import { PostLikeServiceModel } from './models/postLikes.service.model'

@Injectable()
export class PostLikesMongoRepository {
	constructor(@InjectModel(PostLike.name) private PostLikeModel: Model<PostLike>) {}

	async getPostLikeByUser(userId: string, postId: string) {
		if (!ObjectId.isValid(userId) || !ObjectId.isValid(postId)) {
			return null
		}

		const getPostLikeRes = await this.PostLikeModel.findOne({ userId, postId: postId })

		return getPostLikeRes ? this.mapDbPostLikeToClientPostLike(getPostLikeRes) : null
	}

	async createPostLike(userId: string, postId: string, likeStatus: DBTypes.LikeStatuses) {
		const newPostLike: DBTypes.PostLike = {
			userId,
			postId,
			status: likeStatus,
			addedAt: new Date().toISOString(),
		}

		await this.PostLikeModel.create(newPostLike)
	}

	async updatePostLike(
		userId: string,
		postId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<boolean> {
		if (!ObjectId.isValid(userId) || !ObjectId.isValid(postId)) {
			return false
		}

		const updatePostRes = await this.PostLikeModel.updateOne(
			{ userId, postId },
			{ $set: { status: likeStatus } },
		)

		return updatePostRes.modifiedCount === 1
	}

	async getPostLikesStats(
		postId: string,
	): Promise<{ likesCount: number; dislikesCount: number }> {
		if (!ObjectId.isValid(postId)) {
			return { likesCount: 0, dislikesCount: 0 }
		}

		const getPostLikesRes = await this.PostLikeModel.find({ postId }).lean()

		let likesCount = 0
		let dislikesCount = 0

		getPostLikesRes.forEach((likeObj) => {
			if (likeObj.status === DBTypes.LikeStatuses.Like) {
				likesCount++
			} else if (likeObj.status === DBTypes.LikeStatuses.Dislike) {
				dislikesCount++
			}
		})

		return { likesCount, dislikesCount }
	}

	async getUserPostLikeStatus(userId: string, postId: string): Promise<DBTypes.LikeStatuses> {
		const postLikeRes = await this.getPostLikeByUser(userId, postId)
		if (!postLikeRes) {
			return DBTypes.LikeStatuses.None
		}

		return postLikeRes.status
	}

	mapDbPostLikeToClientPostLike(DbPostLike: PostLikeDocument): PostLikeServiceModel {
		return {
			postId: DbPostLike.postId,
			userId: DbPostLike.userId,
			status: DbPostLike.status as DBTypes.LikeStatuses,
		}
	}
}
