import { InjectDataSource } from '@nestjs/typeorm'
import { Model } from 'mongoose'
import { ObjectId } from 'mongodb'
import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { InjectModel } from '@nestjs/mongoose'
import { CommentLike, CommentLikeDocument } from '../../../db/mongo/schemas/commentLike.schema'
import { PGGetCommentLikeQuery } from '../../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../../utils/numbers'
import { CommentLikeServiceModel } from './models/commentLikes.service.model'

@Injectable()
export class CommentLikesRepository {
	constructor(
		@InjectModel(CommentLike.name) private CommentLikeModel: Model<CommentLike>,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getCommentLikeByUser(userId: string, commentId: string) {
		const userIdNum = convertToNumber(userId)
		const commentIdNum = convertToNumber(commentId)
		if (!userIdNum || !commentIdNum) {
			return null
		}

		const commentLikesRes = await this.dataSource.query(
			`SELECT * FROM commentlikes WHERE userid=${userId} AND commentid=${commentId}`,
			[],
		)

		if (!commentLikesRes.length) {
			return null
		}

		return this.mapDbCommentLikeToClientCommentLike(commentLikesRes[0])
	}

	/*async getCommentLikeByUserByMongo(userId: string, commentId: string) {
		if (!ObjectId.isValid(userId) || !ObjectId.isValid(commentId)) {
			return null
		}

		const getCommentLikeRes = await this.CommentLikeModel.findOne({ userId, commentId })

		return getCommentLikeRes
			? this.mapDbCommentLikeToClientCommentLike(getCommentLikeRes)
			: null
	}*/

	async createCommentLike(userId: string, commentId: string, likeStatus: DBTypes.LikeStatuses) {
		// Insert new blog and to get an array like this: [ { id: 10 } ]
		const newCommentLikeIdRes = await this.dataSource.query(
			`INSERT INTO commentlikes
			("userid", "commentid", "status")
			VALUES($1, $2, $3) RETURNING id`,
			[userId, commentId, likeStatus],
		)
	}

	/*async createCommentLikeByMongo(userId: string, commentId: string, likeStatus: DBTypes.LikeStatuses) {
		const newCommentLike: DBTypes.CommentLike = {
			userId,
			commentId,
			status: likeStatus,
		}

		try {
			await this.CommentLikeModel.create(newCommentLike)
		} catch (err: unknown) {
			console.log(err)
		}
	}*/

	async updateCommentLike(
		userId: string,
		commentId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<boolean> {
		const userIdNum = convertToNumber(userId)
		const commentIdNum = convertToNumber(commentId)
		if (!userIdNum || !commentIdNum) {
			return false
		}

		const updateCommentLikeStatusRes = await this.dataSource.query(
			'UPDATE commentlikes SET status = $1 WHERE userid = $2 AND commentid = $3',
			[likeStatus, userId, commentId],
		)

		return updateCommentLikeStatusRes[1] === 1
	}

	/*async updateCommentLikeByMongo(
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
	}*/

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
		DbCommentLike: PGGetCommentLikeQuery,
	): CommentLikeServiceModel {
		return {
			commentId: DbCommentLike.commentid.toString(),
			userId: DbCommentLike.userid,
			status: DbCommentLike.status as DBTypes.LikeStatuses,
		}
	}
}
