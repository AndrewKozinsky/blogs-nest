import { Injectable } from '@nestjs/common'
import { CommentDocument } from '../../../db/schemas/comment.schema'
import { CreatePostCommentDtoModel, GetPostCommentsQueries } from '../posts/model/posts.input.model'
import { UserServiceModel } from '../../users/models/users.service.model'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ObjectId } from 'mongodb'
import { UpdateCommentDtoModel } from './model/comments.input.model'
import { CommentServiceModel } from './model/comments.service.model'
import { Comment } from '../../../db/schemas/comment.schema'

@Injectable()
export class CommentsRepository {
	constructor(@InjectModel(Comment.name) private CommentModel: Model<Comment>) {}

	async getComment(commentId: string) {
		if (!ObjectId.isValid(commentId)) {
			return null
		}

		const getCommentRes = await this.CommentModel.findOne({ _id: new ObjectId(commentId) })

		return getCommentRes ? this.mapDbCommentToClientComment(getCommentRes) : null
	}

	async createPostComment(
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
	}

	async updateComment(
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
	}

	async deleteComment(commentId: string): Promise<boolean> {
		if (!ObjectId.isValid(commentId)) {
			return false
		}

		const result = await this.CommentModel.deleteOne({ _id: new ObjectId(commentId) })

		return result.deletedCount === 1
	}

	mapDbCommentToClientComment(DbComment: CommentDocument): CommentServiceModel {
		return {
			id: DbComment._id.toString(),
			content: DbComment.content,
			commentatorInfo: {
				userId: DbComment.commentatorInfo.userId,
				userLogin: DbComment.commentatorInfo.userLogin,
			},
			createdAt: DbComment.createdAt,
		}
	}
}
