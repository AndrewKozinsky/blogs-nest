import { InjectDataSource } from '@nestjs/typeorm'
import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { CommentLikes } from '../db/pg/entities/commentLikes'
import { LikeStatuses } from '../db/pg/entities/postLikes'
import { CommentLikeServiceModel } from '../models/commentLikes/commentLikes.service.model'

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

	async createCommentLike(userId: string, commentId: string, likeStatus: LikeStatuses) {
		const newCommentLikeRes = await this.dataSource.getRepository(CommentLikes).insert({
			userId,
			commentId,
			status: likeStatus,
		})
	}

	async updateCommentLike(
		userId: string,
		commentId: string,
		likeStatus: LikeStatuses,
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

	async getUserCommentLikeStatus(userId: string, commentId: string): Promise<LikeStatuses> {
		const commentLikeRes = await this.getCommentLikeByUser(userId, commentId)
		if (!commentLikeRes) {
			return LikeStatuses.None
		}

		return commentLikeRes.status
	}

	mapDbCommentLikeToClientCommentLike(DbCommentLike: CommentLikes): CommentLikeServiceModel {
		return {
			commentId: DbCommentLike.commentId.toString(),
			userId: DbCommentLike.userId,
			status: DbCommentLike.status as LikeStatuses,
		}
	}
}
