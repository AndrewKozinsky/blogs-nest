import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Comment, CommentDocument } from '../../../db/mongo/schemas/comment.schema'
import { Post } from '../../../db/mongo/schemas/post.schema'
import { PGGetCommentQuery } from '../../../db/pg/blogs'
import { convertToNumber } from '../../../utils/numbers'
import { CommentLikesRepository } from '../commentLikes/CommentLikesRepository'
import { GetPostCommentsQueries } from '../posts/model/posts.input.model'
import { UsersRepository } from '../../users/usersRepository'
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
export class CommentsQueryRepository {
	constructor(
		@InjectModel(Post.name) private PostModel: Model<Post>,
		@InjectModel(Comment.name) private CommentModel: Model<Comment>,
		private commentLikesRepository: CommentLikesRepository,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getComment(
		userId: undefined | string,
		commentId: string,
	): Promise<null | GetCommentOutModel> {
		const commentIdNum = convertToNumber(commentId)
		if (!commentIdNum) {
			return null
		}

		const commentsRes = await this.dataSource.query(
			`SELECT *, (SELECT 0 as likesCount), (SELECT 0 as dislikesCount), (SELECT 'my user' as userLogin), (SELECT '${DBTypes.LikeStatuses.None}' as currentUserCommentLikeStatus) FROM comments WHERE id=${commentId}`,
			[],
		)

		if (!commentsRes.length) {
			return null
		}

		/*if (userId) {
			currentUserCommentLikeStatus =
				await this.commentLikesRepository.getUserCommentLikeStatus(userId, commentId)
		}*/

		return this.mapDbCommentToOutputComment(commentsRes[0])
	}

	/*async getCommentByMongo(
		userId: undefined | string,
		commentId: string,
	): Promise<null | GetCommentOutModel> {
		if (!ObjectId.isValid(commentId)) {
			return null
		}

		const getCommentRes = await this.CommentModel.findOne({ _id: new ObjectId(commentId) })

		const commentLikesStatsRes =
			await this.commentLikesRepository.getCommentLikesStats(commentId)

		let currentUserCommentLikeStatus = DBTypes.LikeStatuses.None
		if (userId) {
			currentUserCommentLikeStatus =
				await this.commentLikesRepository.getUserCommentLikeStatus(userId, commentId)
		}

		return getCommentRes
			? this.mapDbCommentToOutputComment(
				getCommentRes as any,
				commentLikesStatsRes.likesCount,
				commentLikesStatsRes.dislikesCount,
				currentUserCommentLikeStatus,
			)
			: null
	}*/

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
				const commentLikesStatsRes = await this.commentLikesRepository.getCommentLikesStats(
					comment._id.toString(),
				)

				let currentUserCommentLikeStatus = DBTypes.LikeStatuses.None
				if (userId) {
					currentUserCommentLikeStatus =
						await this.commentLikesRepository.getUserCommentLikeStatus(
							userId,
							comment._id.toString(),
						)
				}

				return this.mapDbCommentToOutputComment(
					comment as any,
					// @ts-ignore
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

	/*async getPostCommentsByMongo(
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
				const commentLikesStatsRes = await this.commentLikesRepository.getCommentLikesStats(
					comment._id.toString(),
				)

				let currentUserCommentLikeStatus = DBTypes.LikeStatuses.None
				if (userId) {
					currentUserCommentLikeStatus =
						await this.commentLikesRepository.getUserCommentLikeStatus(
							userId,
							comment._id.toString(),
						)
				}

				return this.mapDbCommentToOutputComment(
					comment as any,
					// @ts-ignore
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
	}*/

	mapDbCommentToOutputComment(DbComment: PGGetCommentQuery): CommentOutModel {
		return {
			id: DbComment.id,
			content: DbComment.content,
			commentatorInfo: {
				userId: DbComment.userid,
				userLogin: DbComment.userlogin,
			},
			createdAt: DbComment.createdat,
			likesInfo: {
				likesCount: DbComment.likescount,
				dislikesCount: DbComment.dislikescount,
				// @ts-ignore
				myStatus: DbComment.currentUserCommentLikeStatus,
			},
		}
	}
}
