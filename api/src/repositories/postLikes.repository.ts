import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { LikeStatuses, PostLikes } from '../db/pg/entities/postLikes'
import { PostLikeServiceModel } from '../models/postLikes/postLikes.service.model'

@Injectable()
export class PostLikesRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		@InjectRepository(PostLikes) private readonly postLikesTypeORM: Repository<PostLikes>,
	) {}

	async getPostLikeByUser(userId: string, postId: string) {
		const postLike = await this.postLikesTypeORM.findOneBy({ userId, postId })

		if (!postLike) {
			return null
		}

		return this.mapDbPostLikeToClientPostLike(postLike)
	}

	async createPostLike(userId: string, postId: string, likeStatus: LikeStatuses) {
		const addedAt = new Date().toISOString()

		const postLike = await this.postLikesTypeORM.insert({
			userId,
			postId,
			status: likeStatus,
			addedAt,
		})
	}

	async updatePostLike(
		userId: string,
		postId: string,
		likeStatus: LikeStatuses,
	): Promise<boolean> {
		const updatePostLikeRes = await this.postLikesTypeORM
			.createQueryBuilder()
			.update(PostLikes)
			.set({
				userId,
				postId,
				status: likeStatus,
			})
			.where('userId = :userId AND postId = :postId', { userId, postId })
			.execute()

		return updatePostLikeRes.affected == 1
	}

	async getUserPostLikeStatus(userId: string, postId: string): Promise<LikeStatuses> {
		const postLikeRes = await this.getPostLikeByUser(userId, postId)
		if (!postLikeRes) {
			return LikeStatuses.None
		}

		return postLikeRes.status
	}

	mapDbPostLikeToClientPostLike(DbPostLike: PostLikes): PostLikeServiceModel {
		return {
			postId: DbPostLike.postId.toString(),
			userId: DbPostLike.userId.toString(),
			status: DbPostLike.status as LikeStatuses,
		}
	}
}
