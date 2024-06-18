import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Comment } from '../../../db/mongo/schemas/comment.schema'
import { Post } from '../../../db/mongo/schemas/post.schema'
import { PGGetCommentQuery, PGGetPostQuery } from '../../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../../utils/numbers'
import { CommentLikesRepository } from '../commentLikes/CommentLikesRepository'
import { GetPostCommentsQueries } from '../posts/model/posts.input.model'
import { CommentOutModel, GetCommentOutModel } from './model/comments.output.model'

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
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getComment(
		userId: undefined | string,
		commentId: string,
	): Promise<null | GetCommentOutModel> {
		// const commentIdNum = convertToNumber(commentId)
		/*if (!commentIdNum) {
			return null
		}*/

		/*const commentsRes = await this.dataSource.query(
			`SELECT *,
(SELECT COUNT(*) as likescount FROM commentlikes WHERE status = '${DBTypes.LikeStatuses.Like}' AND commentid = ${commentId}),
(SELECT COUNT(*) as dislikescount FROM commentlikes WHERE  status = '${DBTypes.LikeStatuses.Dislike}' AND commentid = ${commentId}),
(SELECT login as userlogin FROM users WHERE id = c.userid),
(SELECT status as currentusercommentlikestatus FROM commentlikes WHERE userid = ${userId || 0} AND commentid = c.id)
FROM comments c WHERE id=${commentId}`,
			[],
		)*/

		/*if (!commentsRes.length) {
			return null
		}*/

		// return this.mapDbCommentToOutputComment(commentsRes[0])

		// --
		// @ts-ignore
		return null
	}

	/*async getCommentNative(
		userId: undefined | string,
		commentId: string,
	): Promise<null | GetCommentOutModel> {
		const commentIdNum = convertToNumber(commentId)
		if (!commentIdNum) {
			return null
		}

		const commentsRes = await this.dataSource.query(
			`SELECT *,
(SELECT COUNT(*) as likescount FROM commentlikes WHERE status = '${DBTypes.LikeStatuses.Like}' AND commentid = ${commentId}),
(SELECT COUNT(*) as dislikescount FROM commentlikes WHERE  status = '${DBTypes.LikeStatuses.Dislike}' AND commentid = ${commentId}),
(SELECT login as userlogin FROM users WHERE id = c.userid),
(SELECT status as currentusercommentlikestatus FROM commentlikes WHERE userid = ${userId || 0} AND commentid = c.id)
FROM comments c WHERE id=${commentId}`,
			[],
		)

		if (!commentsRes.length) {
			return null
		}

		return this.mapDbCommentToOutputComment(commentsRes[0])
	}*/

	async getPostComments(
		userId: undefined | string,
		postId: string,
		query: GetPostCommentsQueries,
	): Promise<GetPostCommentsResult> {
		const sortBy = query.sortBy ?? 'createdat'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		/*const getPostsRes: PGGetPostQuery[] = await this.dataSource.query(
			'SELECT * FROM posts WHERE id = $1',
			[postId],
		)*/

		/*if (!getPostsRes.length) {
			return {
				status: 'postNotFound',
			}
		}*/

		/*const totalPostCommentsCountRes = await this.dataSource.query(
			`SELECT COUNT(*) FROM comments WHERE postid = ${postId}`,
			[],
		)*/

		// const totalPostCommentsCount = totalPostCommentsCountRes[0].count
		// const pagesCount = Math.ceil(totalPostCommentsCount / pageSize)

		/*let queryStr = `SELECT *,
		(SELECT COUNT(*) as likescount FROM commentlikes WHERE c.id = commentid AND status = '${DBTypes.LikeStatuses.Like}'),
		(SELECT COUNT(*) as dislikescount FROM commentlikes WHERE c.id = commentid AND status = '${DBTypes.LikeStatuses.Dislike}'),
		(SELECT login as userlogin FROM users WHERE c.userid = id)`

		if (userId) {
			queryStr += `, (SELECT status as currentusercommentlikestatus FROM commentlikes WHERE c.id = commentid AND userid = ${userId})`
		} else {
			queryStr += `, (SELECT '${DBTypes.LikeStatuses.None}' as currentusercommentlikestatus)`
		}

		queryStr += ` FROM comments c WHERE postid = ${postId} ORDER BY ${sortBy} COLLATE "C" ${sortDirection} LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`*/

		// const getPostCommentsRes: PGGetCommentQuery[] = await this.dataSource.query(queryStr, [])

		/*return {
			status: 'success',
			data: {
				pagesCount,
				page: pageNumber,
				pageSize,
				totalCount: +totalPostCommentsCount,
				items: getPostCommentsRes.map((postComment) => {
					return this.mapDbCommentToOutputComment(postComment)
				}),
			},
		}*/

		// --
		// @ts-ignore
		return null
	}

	/*async getPostCommentsNative(
		userId: undefined | string,
		postId: string,
		query: GetPostCommentsQueries,
	): Promise<GetPostCommentsResult> {
		const sortBy = query.sortBy ?? 'createdat'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const postIdNum = convertToNumber(postId)
		if (!postIdNum) {
			return {
				status: 'postNotValid',
			}
		}

		const getPostsRes: PGGetPostQuery[] = await this.dataSource.query(
			'SELECT * FROM posts WHERE id = $1',
			[postId],
		)

		if (!getPostsRes.length) {
			return {
				status: 'postNotFound',
			}
		}

		const totalPostCommentsCountRes = await this.dataSource.query(
			`SELECT COUNT(*) FROM comments WHERE postid = ${postId}`,
			[],
		) // [ { count: '18' } ]

		const totalPostCommentsCount = totalPostCommentsCountRes[0].count
		const pagesCount = Math.ceil(totalPostCommentsCount / pageSize)

		let queryStr = `SELECT *,
		(SELECT COUNT(*) as likescount FROM commentlikes WHERE c.id = commentid AND status = '${DBTypes.LikeStatuses.Like}'),
		(SELECT COUNT(*) as dislikescount FROM commentlikes WHERE c.id = commentid AND status = '${DBTypes.LikeStatuses.Dislike}'),
		(SELECT login as userlogin FROM users WHERE c.userid = id)`

		if (userId) {
			queryStr += `, (SELECT status as currentusercommentlikestatus FROM commentlikes WHERE c.id = commentid AND userid = ${userId})`
		} else {
			queryStr += `, (SELECT '${DBTypes.LikeStatuses.None}' as currentusercommentlikestatus)`
		}

		queryStr += ` FROM comments c WHERE postid = ${postId} ORDER BY ${sortBy} COLLATE "C" ${sortDirection} LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`

		const getPostCommentsRes: PGGetCommentQuery[] = await this.dataSource.query(queryStr, [])

		return {
			status: 'success',
			data: {
				pagesCount,
				page: pageNumber,
				pageSize,
				totalCount: +totalPostCommentsCount,
				items: getPostCommentsRes.map((postComment) => {
					return this.mapDbCommentToOutputComment(postComment)
				}),
			},
		}
	}*/

	mapDbCommentToOutputComment(DbComment: PGGetCommentQuery): CommentOutModel {
		return {
			id: DbComment.id.toString(),
			content: DbComment.content,
			commentatorInfo: {
				userId: DbComment.userid.toString(),
				userLogin: DbComment.userlogin,
			},
			createdAt: DbComment.createdat,
			likesInfo: {
				likesCount: +DbComment.likescount,
				dislikesCount: +DbComment.dislikescount,
				// @ts-ignore
				myStatus: DbComment.currentusercommentlikestatus ?? DBTypes.LikeStatuses.None,
			},
		}
	}
}
