import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { PostLike, PostLikeDocument } from '../../../db/mongo/schemas/postLike.schema'
import { PGGetPostLikeQuery } from '../../../db/pg/blogs'
import { convertToNumber } from '../../../utils/numbers'
import { PostLikeServiceModel } from './models/postLikes.service.model'

@Injectable()
export class PostLikesRepository {
	constructor(
		@InjectModel(PostLike.name) private PostLikeModel: Model<PostLike>,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getPostLikeByUser(userId: string, postId: string) {
		const userIdNum = convertToNumber(userId)
		const postIdNum = convertToNumber(postId)
		if (!userIdNum || !postIdNum) {
			return null
		}

		const postLikesRes = await this.dataSource.query(
			`SELECT * FROM postlikes WHERE userid=${userId} AND postId=${postId}`,
			[],
		)

		if (!postLikesRes.length) {
			return null
		}

		return this.mapDbPostLikeToClientPostLike(postLikesRes)
	}

	/*async getPostLikeByUserByMongo(userId: string, postId: string) {
		if (!ObjectId.isValid(userId) || !ObjectId.isValid(postId)) {
			return null
		}

		const getPostLikeRes = await this.PostLikeModel.findOne({ userId, postId: postId })

		return getPostLikeRes ? this.mapDbPostLikeToClientPostLike(getPostLikeRes) : null
	}*/

	async createPostLike(userId: string, postId: string, likeStatus: DBTypes.LikeStatuses) {
		const addedAt = new Date().toISOString()

		const newPostLikeRes = await this.dataSource.query(
			`INSERT INTO postlikes
			("userid", "postid", "status", "addedat")
			VALUES($1, $2, $3, $4) RETURNING id`,
			[userId, postId, likeStatus, addedAt],
		)
	}

	/*async createPostLikeByMongo(userId: string, postId: string, likeStatus: DBTypes.LikeStatuses) {
		const newPostLike: DBTypes.PostLike = {
			userId,
			postId,
			status: likeStatus,
			addedAt: new Date().toISOString(),
		}

		await this.PostLikeModel.create(newPostLike)
	}*/

	async updatePostLike(
		userId: string,
		postId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<boolean> {
		const userIdNum = convertToNumber(userId)
		const postIdNum = convertToNumber(postId)
		if (!userIdNum || !postIdNum) {
			return false
		}

		const updatePostLikeRes = await this.dataSource.query(
			'UPDATE postlikes SET status = $1 WHERE userid = $2 AND postid=$3',
			[likeStatus, userId, postId],
		)

		return updatePostLikeRes[1] === 1
	}

	/*async updatePostLikeByMongo(
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
	}*/

	async getPostLikesStats(
		postId: string,
	): Promise<{ likesCount: number; dislikesCount: number }> {
		const postIdNum = convertToNumber(postId)
		if (!postIdNum) {
			return { likesCount: 0, dislikesCount: 0 }
		}

		const getPostLikesRes = await this.dataSource.query(
			`SELECT * FROM postlikes WHERE id=${postId}`,
			[],
		)

		let likesCount = 0
		let dislikesCount = 0

		getPostLikesRes.forEach((likeObj: any) => {
			if (likeObj.status === DBTypes.LikeStatuses.Like) {
				likesCount++
			} else if (likeObj.status === DBTypes.LikeStatuses.Dislike) {
				dislikesCount++
			}
		})

		return { likesCount, dislikesCount }
	}

	/*async getPostLikesStatsByMongo(
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
	}*/

	async getUserPostLikeStatus(userId: string, postId: string): Promise<DBTypes.LikeStatuses> {
		const postLikeRes = await this.getPostLikeByUser(userId, postId)
		if (!postLikeRes) {
			return DBTypes.LikeStatuses.None
		}

		return postLikeRes.status
	}

	mapDbPostLikeToClientPostLike(DbPostLike: PGGetPostLikeQuery): PostLikeServiceModel {
		return {
			postId: DbPostLike.postid,
			userId: DbPostLike.userid,
			status: DbPostLike.status as DBTypes.LikeStatuses,
		}
	}
}
