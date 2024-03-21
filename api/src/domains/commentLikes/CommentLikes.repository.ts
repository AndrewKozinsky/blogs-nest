import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../db/dbTypes'
import { CommentLike, CommentLikeDocument } from '../../db/schemas/commentLike.schema'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ObjectId } from 'mongodb'
import { CommentLikeServiceModel } from './models/commentLikes.service.model'

@Injectable()
export class CommentLikesRepository {
	constructor(@InjectModel(CommentLike.name) private CommentLikeModel: Model<CommentLike>) {}

	async getCommentLikeByUser(userId: string, commentId: string) {
		if (!ObjectId.isValid(userId) || !ObjectId.isValid(commentId)) {
			return null
		}

		const getCommentLikeRes = await this.CommentLikeModel.findOne({ userId, commentId })

		return getCommentLikeRes
			? this.mapDbCommentLikeToClientCommentLike(getCommentLikeRes)
			: null
	}

	async createCommentLike(userId: string, commentId: string, likeStatus: DBTypes.LikeStatuses) {
		const newCommentLike: DBTypes.CommentLike = {
			userId,
			commentId,
			status: likeStatus,
		}

		await this.CommentLikeModel.create(newCommentLike)
	}

	async updateCommentLike(
		userId: string,
		commentId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<boolean> {
		if (!ObjectId.isValid(userId) || !ObjectId.isValid(commentId)) {
			return false
		}

		const updateCommentRes = await this.CommentLikeModel.updateOne(
			{ userId, commentId },
			{ $set: { status: likeStatus } },
		)

		return updateCommentRes.modifiedCount === 1
	}

	async getCommentLikesStats(
		commentId: string,
	): Promise<{ likesCount: number; dislikesCount: number }> {
		if (!ObjectId.isValid(commentId)) {
			return { likesCount: 0, dislikesCount: 0 }
		}

		const getCommentLikesRes = await this.CommentLikeModel.find({ commentId }).lean()

		let likesCount = 0
		let dislikesCount = 0

		getCommentLikesRes.forEach((likeObj) => {
			if (likeObj.status === DBTypes.LikeStatuses.Like) {
				likesCount++
			} else if (likeObj.status === DBTypes.LikeStatuses.Dislike) {
				dislikesCount++
			}
		})

		return { likesCount, dislikesCount }
	}

	async getUserCommentLikeStatus(
		userId: string,
		commentId: string,
	): Promise<DBTypes.LikeStatuses> {
		const commentLikeRes = await this.getCommentLikeByUser(userId, commentId)
		if (!commentLikeRes) {
			return DBTypes.LikeStatuses.None
		}

		return commentLikeRes.status
	}

	mapDbCommentLikeToClientCommentLike(
		DbCommentLike: CommentLikeDocument,
	): CommentLikeServiceModel {
		return {
			commentId: DbCommentLike.commentId,
			userId: DbCommentLike.userId,
			status: DbCommentLike.status as DBTypes.LikeStatuses,
		}
	}
}
