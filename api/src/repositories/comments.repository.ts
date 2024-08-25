import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Comment } from '../db/pg/entities/comment'
import { CreatePostCommentDtoModel } from '../models/posts/posts.input.model'
import { UserServiceModel } from '../models/users/users.service.model'
import { UpdateCommentDtoModel } from '../models/comments/comments.input.model'
import { CommentServiceModel } from '../models/comments/comments.service.model'

@Injectable()
export class CommentsRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getComment(commentId: string) {
		const comment = await this.dataSource
			.getRepository(Comment)
			.findOne({ where: { id: commentId }, relations: { user: true } })

		if (!comment) {
			return null
		}

		return this.mapDbCommentToClientComment(comment)
	}

	async createPostComment(
		user: UserServiceModel,
		postId: string,
		commentDto: CreatePostCommentDtoModel,
	) {
		// Current data like '2024-05-19T14:36:40.112Z'
		const createdAt = new Date().toISOString()

		const newPostComment = await this.dataSource.getRepository(Comment).insert({
			postId,
			userId: user.id,
			content: commentDto.content,
			createdAt,
		})

		return newPostComment.identifiers[0].id
	}

	async updateComment(
		commentId: string,
		updateCommentDto: UpdateCommentDtoModel,
	): Promise<boolean> {
		const updateCommentRes = await this.dataSource.getRepository(Comment).update(commentId, {
			content: updateCommentDto.content,
		})

		return updateCommentRes.affected === 1
	}

	async deleteComment(commentId: string): Promise<boolean> {
		const updateCommentRes = await this.dataSource.getRepository(Comment).delete(commentId)

		return updateCommentRes.affected === 1
	}

	mapDbCommentToClientComment(DbComment: Comment): CommentServiceModel {
		return {
			id: DbComment.id.toString(),
			content: DbComment.content,
			commentatorInfo: {
				userId: DbComment.user.id.toString(),
				userLogin: DbComment.user.login,
			},
			createdAt: DbComment.createdAt,
		}
	}
}
