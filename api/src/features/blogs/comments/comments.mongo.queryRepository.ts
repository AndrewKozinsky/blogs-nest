import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Comment, CommentDocument } from '../../../db/mongo/schemas/comment.schema'
import { Post } from '../../../db/mongo/schemas/post.schema'
import { CommentLikesMongoRepository } from '../commentLikes/CommentLikes.mongo.repository'
import { GetPostCommentsQueries } from '../posts/model/posts.input.model'
import { UsersMongoRepository } from '../../users/users.mongo.repository'
import { CommentOutModel, GetCommentOutModel } from './model/comments.output.model'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ObjectId } from 'mongodb'

type GetPostCommentsResult =
	| {
			status: 'postNotValid'
	  }
	| {
			status: 'postNotFound'
	  }
	| {
			status: 'success'
			data: {
				pagesCount: number
				page: number
				pageSize: number
				totalCount: number
				items: CommentOutModel[]
			}
	  }

@Injectable()
export class CommentsMongoQueryRepository {
	constructor(
		@InjectModel(Post.name) private PostModel: Model<Post>,
		@InjectModel(Comment.name) private CommentModel: Model<Comment>,
		private commentLikesMongoRepository: CommentLikesMongoRepository,
	) {}

	async getComment(
		userId: undefined | string,
		commentId: string,
	): Promise<null | GetCommentOutModel> {
		if (!ObjectId.isValid(commentId)) {
			return null
		}

		const getCommentRes = await this.CommentModel.findOne({ _id: new ObjectId(commentId) })

		const commentLikesStatsRes =
			await this.commentLikesMongoRepository.getCommentLikesStats(commentId)

		let currentUserCommentLikeStatus = DBTypes.LikeStatuses.None
		if (userId) {
			currentUserCommentLikeStatus =
				await this.commentLikesMongoRepository.getUserCommentLikeStatus(userId, commentId)
		}

		return getCommentRes
			? this.mapDbCommentToOutputComment(
					getCommentRes as any,
					commentLikesStatsRes.likesCount,
					commentLikesStatsRes.dislikesCount,
					currentUserCommentLikeStatus,
				)
			: null
	}

	async getPostComments(
		userId: undefined | string,
		postId: string,
		queries: GetPostCommentsQueries,
	): Promise<GetPostCommentsResult> {
		const sortBy = queries.sortBy ?? 'createdAt'
		const sortDirection = queries.sortDirection ?? 'desc'
		const sort = { [sortBy]: sortDirection }

		const pageNumber = queries.pageNumber ? +queries.pageNumber : 1
		const pageSize = queries.pageSize ? +queries.pageSize : 10

		if (!ObjectId.isValid(postId)) {
			return {
				status: 'postNotValid',
			}
		}

		const getPostRes = await this.PostModel.findOne({ _id: new ObjectId(postId) }).lean()

		if (!getPostRes) {
			return {
				status: 'postNotFound',
			}
		}

		const totalPostCommentsCount = await this.CommentModel.countDocuments({ postId })
		const pagesCount = Math.ceil(totalPostCommentsCount / pageSize)

		const getPostCommentsRes = await this.CommentModel.find({ postId })
			.sort(sort)
			.skip((pageNumber - 1) * pageSize)
			.limit(pageSize)
			.lean()

		const items = await Promise.all(
			getPostCommentsRes.map(async (comment) => {
				const commentLikesStatsRes =
					await this.commentLikesMongoRepository.getCommentLikesStats(
						comment._id.toString(),
					)

				let currentUserCommentLikeStatus = DBTypes.LikeStatuses.None
				if (userId) {
					currentUserCommentLikeStatus =
						await this.commentLikesMongoRepository.getUserCommentLikeStatus(
							userId,
							comment._id.toString(),
						)
				}

				return this.mapDbCommentToOutputComment(
					comment as any,
					commentLikesStatsRes.likesCount,
					commentLikesStatsRes.dislikesCount,
					currentUserCommentLikeStatus,
				)
			}),
		)

		return {
			status: 'success',
			data: {
				pagesCount,
				page: pageNumber,
				pageSize,
				totalCount: totalPostCommentsCount,
				items,
			},
		}
	}

	mapDbCommentToOutputComment(
		DbComment: CommentDocument,
		likesCount: number,
		dislikesCount: number,
		currentUserCommentLikeStatus: DBTypes.LikeStatuses,
	): CommentOutModel {
		return {
			id: DbComment._id.toString(),
			content: DbComment.content,
			commentatorInfo: {
				userId: DbComment.commentatorInfo.userId,
				userLogin: DbComment.commentatorInfo.userLogin,
			},
			createdAt: DbComment.createdAt,
			likesInfo: {
				likesCount,
				dislikesCount,
				myStatus: currentUserCommentLikeStatus,
			},
		}
	}
}
