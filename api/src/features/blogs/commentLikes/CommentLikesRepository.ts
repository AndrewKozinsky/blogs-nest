import { InjectDataSource } from '@nestjs/typeorm'
import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { CommentLikes } from '../../../db/pg/entities/commentLikes'
import { CommentLikeServiceModel } from './models/commentLikes.service.model'

@Injectable()
export class CommentLikesRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getCommentLikeByUser(userId: string, commentId: string) {
		const commentLike = await this.dataSource
			.getRepository(CommentLikes)
			.findOne({ where: { userId, commentId } })

		if (!commentLike) {
			return null
		}

		return this.mapDbCommentLikeToClientCommentLike(commentLike)
	}

	/*async getCommentLikeByUserNative(userId: string, commentId: string) {
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
	}*/

	async createCommentLike(userId: string, commentId: string, likeStatus: DBTypes.LikeStatuses) {
		const newCommentLikeRes = await this.dataSource.getRepository(CommentLikes).insert({
			userId,
			commentId,
			status: likeStatus,
		})
	}

	/*async createCommentLikeNative(userId: string, commentId: string, likeStatus: DBTypes.LikeStatuses) {
		// Insert new blog and to get an array like this: [ { id: 10 } ]
		const newCommentLikeIdRes = await this.dataSource.query(
			`INSERT INTO commentlikes
			("userid", "commentid", "status")
			VALUES($1, $2, $3) RETURNING id`,
			[userId, commentId, likeStatus],
		)
	}*/

	async updateCommentLike(
		userId: string,
		commentId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<boolean> {
		const updateCommentLikeStatusRes = await this.dataSource
			.getRepository(CommentLikes)
			.createQueryBuilder()
			.update({
				status: likeStatus,
			})
			.where('commentId = :commentId AND userId = :userId', { commentId, userId })
			.execute()

		return updateCommentLikeStatusRes.affected == 1
	}

	/*async updateCommentLikeNative(
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
	}*/

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

	mapDbCommentLikeToClientCommentLike(DbCommentLike: CommentLikes): CommentLikeServiceModel {
		return {
			commentId: DbCommentLike.commentId.toString(),
			userId: DbCommentLike.userId,
			status: DbCommentLike.status as DBTypes.LikeStatuses,
		}
	}
}
