import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { Model } from 'mongoose'
import { ObjectId } from 'mongodb'
import { InjectModel } from '@nestjs/mongoose'
import { DataSource } from 'typeorm'
import { PGGetCommentQuery } from '../../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../../utils/numbers'
import { CreatePostCommentDtoModel } from '../posts/model/posts.input.model'
import { UserServiceModel } from '../../users/models/users.service.model'
import { CommentDocument } from '../../../db/mongo/schemas/comment.schema'
import { UpdateCommentDtoModel } from './model/comments.input.model'
import { CommentServiceModel } from './model/comments.service.model'
import { Comment } from '../../../db/mongo/schemas/comment.schema'

@Injectable()
export class CommentsRepository {
	constructor(
		@InjectModel(Comment.name) private CommentModel: Model<Comment>,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getComment(commentId: string) {
		const commentIdNum = convertToNumber(commentId)
		if (!commentIdNum) {
			return false
		}

		const commentsRes = await this.dataSource.query(
			`SELECT *, (SELECT 'my user login' as userlogin) FROM comments WHERE id=${commentId}`,
			[],
		)

		if (!commentsRes.length) {
			return null
		}

		return this.mapDbCommentToClientComment(commentsRes[0])
	}

	/*async getCommentByMongo(commentId: string) {
		if (!ObjectId.isValid(commentId)) {
			return null
		}

		const getCommentRes = await this.CommentModel.findOne({ _id: new ObjectId(commentId) })

		return getCommentRes ? this.mapDbCommentToClientComment(getCommentRes) : null
	}*/

	async createPostComment(
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
	}

	/*async createPostCommentByMongo(
		user: UserServiceModel,
		postId: string,
		commentDto: CreatePostCommentDtoModel,
	) {
		const newPostComment = {
			postId,
			content: commentDto.content,
			commentatorInfo: {
				userId: user.id,
				userLogin: user.account.login,
			},
			createdAt: new Date().toISOString(),
		}

		const createdPostCommentRes = await this.CommentModel.create(newPostComment)
		const postClientComment = this.mapDbCommentToClientComment(createdPostCommentRes as any)
		return postClientComment.id
	}*/

	async updateComment(
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
	}

	/*async updateCommentByMongo(
		commentId: string,
		updateCommentDto: UpdateCommentDtoModel,
	): Promise<boolean> {
		if (!ObjectId.isValid(commentId)) {
			return false
		}

		const updateCommentRes = await this.CommentModel.updateOne(
			{ _id: new ObjectId(commentId) },
			{ $set: updateCommentDto },
		)

		return updateCommentRes.modifiedCount === 1
	}*/

	async deleteComment(commentId: string): Promise<boolean> {
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
	}

	/*async deleteCommentByMongo(commentId: string): Promise<boolean> {
		if (!ObjectId.isValid(commentId)) {
			return false
		}

		const result = await this.CommentModel.deleteOne({ _id: new ObjectId(commentId) })

		return result.deletedCount === 1
	}*/

	mapDbCommentToClientComment(DbComment: PGGetCommentQuery): CommentServiceModel {
		return {
			id: DbComment.id.toString(),
			content: DbComment.content,
			commentatorInfo: {
				userId: DbComment.userid.toString(),
				userLogin: DbComment.userlogin,
			},
			createdAt: DbComment.createdat,
		}
	}
}
