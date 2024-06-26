import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Comment } from '../../../db/pg/entities/comment'
import { PGGetCommentQuery } from '../../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../../utils/numbers'
import { CreatePostCommentDtoModel } from '../posts/model/posts.input.model'
import { UserServiceModel } from '../../users/models/users.service.model'
import { UpdateCommentDtoModel } from './model/comments.input.model'
import { CommentServiceModel } from './model/comments.service.model'

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

	/*async getCommentNative(commentId: string) {
		const commentIdNum = convertToNumber(commentId)
		if (!commentIdNum) {
			return false
		}

		const commentsRes = await this.dataSource.query(
			`SELECT *, (SELECT login as userlogin FROM users WHERE id = c.userid) FROM comments c WHERE id=${commentId}`,
			[],
		)

		if (!commentsRes.length) {
			return null
		}

		return this.mapDbCommentToClientComment(commentsRes[0])
	}*/

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

	/*async createPostCommentNative(
		user: UserServiceModel,
		postId: string,
		commentDto: CreatePostCommentDtoModel,
	) {
		// Current data like '2024-05-19T14:36:40.112Z'
		const createdAt = new Date().toISOString()

		// Insert new blog and to get an array like this: [ { id: 10 } ]
		const newPostCommentsIdRes = await this.dataSource.query(
			`INSERT INTO comments
			("postid", "userid", "content", "createdat")
			VALUES($1, $2, $3, $4) RETURNING id`,
			[postId, user.id, commentDto.content, createdAt],
		)

		return newPostCommentsIdRes[0].id
	}*/

	async updateComment(
		commentId: string,
		updateCommentDto: UpdateCommentDtoModel,
	): Promise<boolean> {
		const updateCommentRes = await this.dataSource.getRepository(Comment).update(commentId, {
			content: updateCommentDto.content,
		})

		return updateCommentRes.affected === 1
	}

	/*async updateCommentNative(
		commentId: string,
		updateCommentDto: UpdateCommentDtoModel,
	): Promise<boolean> {
		const commentIdNum = convertToNumber(commentId)
		if (!commentIdNum) {
			return false
		}

		const updateCommentRes = await this.dataSource.query(
			'UPDATE comments SET content = $1 WHERE id = $2;',
			[updateCommentDto.content, commentId],
		)

		return updateCommentRes[1] === 1
	}*/

	async deleteComment(commentId: string): Promise<boolean> {
		const updateCommentRes = await this.dataSource.getRepository(Comment).delete(commentId)

		return updateCommentRes.affected === 1
	}

	/*async deleteCommentNative(commentId: string): Promise<boolean> {
		const commentIdNum = convertToNumber(commentId)
		if (!commentIdNum) {
			return false
		}

		// The query will return an array where the second element is a number of deleted documents
		// [ [], 1 ]
		const deleteCommentRes = await this.dataSource.query(
			`DELETE FROM comments WHERE id='${commentId}'`,
			[],
		)

		return deleteCommentRes[1] === 1
	}*/

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
