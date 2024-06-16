import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { PGGetPostLikeQuery } from '../../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../../utils/numbers'
import { PostLikeServiceModel } from './models/postLikes.service.model'

@Injectable()
export class PostLikesRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPostLikeByUser(userId: string, postId: string) {
		// const userIdNum = convertToNumber(userId)
		// const postIdNum = convertToNumber(postId)
		/*if (!userIdNum || !postIdNum) {
			return null
		}*/

		/*const postLikesRes = await this.dataSource.query(
			`SELECT * FROM postlikes WHERE userid = ${userId} AND postId = ${postId}`,
			[],
		)*/

		/*if (!postLikesRes.length) {
			return null
		}*/

		// return this.mapDbPostLikeToClientPostLike(postLikesRes[0])

		// --
		// @ts-ignore
		return null
	}

	/*async getPostLikeByUserNative(userId: string, postId: string) {
		const userIdNum = convertToNumber(userId)
		const postIdNum = convertToNumber(postId)
		if (!userIdNum || !postIdNum) {
			return null
		}

		const postLikesRes = await this.dataSource.query(
			`SELECT * FROM postlikes WHERE userid = ${userId} AND postId = ${postId}`,
			[],
		)

		if (!postLikesRes.length) {
			return null
		}

		return this.mapDbPostLikeToClientPostLike(postLikesRes[0])
	}*/

	async createPostLike(userId: string, postId: string, likeStatus: DBTypes.LikeStatuses) {
		// const addedAt = new Date().toISOString()

		/*const newPostLikeRes = await this.dataSource.query(
			`INSERT INTO postlikes
			("userid", "postid", "status", "addedat")
			VALUES($1, $2, $3, $4) RETURNING id`,
			[userId, postId, likeStatus, addedAt],
		)*/

		// --
		// @ts-ignore
		return null
	}

	/*async createPostLikeNative(userId: string, postId: string, likeStatus: DBTypes.LikeStatuses) {
		const addedAt = new Date().toISOString()

		const newPostLikeRes = await this.dataSource.query(
			`INSERT INTO postlikes
			("userid", "postid", "status", "addedat")
			VALUES($1, $2, $3, $4) RETURNING id`,
			[userId, postId, likeStatus, addedAt],
		)
	}*/

	async updatePostLike(
		userId: string,
		postId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<boolean> {
		// const userIdNum = convertToNumber(userId)
		// const postIdNum = convertToNumber(postId)
		/*if (!userIdNum || !postIdNum) {
			return false
		}*/

		/*const updatePostLikeRes = await this.dataSource.query(
			'UPDATE postlikes SET status = $1 WHERE userid = $2 AND postid = $3',
			[likeStatus, userId, postId],
		)*/

		// return updatePostLikeRes[1] === 1

		// --
		// @ts-ignore
		return null
	}

	/*async updatePostLikeNative(
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
			'UPDATE postlikes SET status = $1 WHERE userid = $2 AND postid = $3',
			[likeStatus, userId, postId],
		)

		return updatePostLikeRes[1] === 1
	}*/

	async getPostLikesStats(
		postId: string,
	): Promise<{ likesCount: number; dislikesCount: number }> {
		// const postIdNum = convertToNumber(postId)
		/*if (!postIdNum) {
			return { likesCount: 0, dislikesCount: 0 }
		}*/

		/*const getPostLikesRes = await this.dataSource.query(
			`SELECT * FROM postlikes WHERE id=${postId}`,
			[],
		)*/

		// let likesCount = 0
		// let dislikesCount = 0

		/*getPostLikesRes.forEach((likeObj: any) => {
			if (likeObj.status === DBTypes.LikeStatuses.Like) {
				likesCount++
			} else if (likeObj.status === DBTypes.LikeStatuses.Dislike) {
				dislikesCount++
			}
		})*/

		// return { likesCount, dislikesCount }

		// --
		// @ts-ignore
		return null
	}

	/*async getPostLikesStatsNative(
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
	}*/

	async getUserPostLikeStatus(userId: string, postId: string): Promise<DBTypes.LikeStatuses> {
		// const postLikeRes = await this.getPostLikeByUser(userId, postId)
		/*if (!postLikeRes) {
			return DBTypes.LikeStatuses.None
		}*/

		// return postLikeRes.status

		// --
		// @ts-ignore
		return null
	}

	/*async getUserPostLikeStatusNative(userId: string, postId: string): Promise<DBTypes.LikeStatuses> {
		const postLikeRes = await this.getPostLikeByUser(userId, postId)
		if (!postLikeRes) {
			return DBTypes.LikeStatuses.None
		}

		return postLikeRes.status
	}*/

	mapDbPostLikeToClientPostLike(DbPostLike: PGGetPostLikeQuery): PostLikeServiceModel {
		return {
			postId: DbPostLike.postid.toString(),
			userId: DbPostLike.userid.toString(),
			status: DbPostLike.status as DBTypes.LikeStatuses,
		}
	}
}
