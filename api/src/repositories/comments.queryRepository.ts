import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Comment } from '../db/pg/entities/comment'
import { Post } from '../db/pg/entities/post'
import { LikeStatuses } from '../db/pg/entities/postLikes'
import { GetPostCommentsQueries } from '../models/posts/posts.input.model'
import { CommentOutModel, GetCommentOutModel } from '../models/comments/comments.output.model'

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
		@InjectDataSource() private dataSource: DataSource,
		// @InjectRepository(Comment) private readonly commentsTypeORM: Repository<Comment>,
	) {}

	async getComment(
		userId: undefined | string,
		commentId: string,
	): Promise<null | GetCommentOutModel> {
		type DbComment = {
			id: number
			content: string
			createdAt: string
			postId: number
			userId: number
			likesCount: string
			dislikesCount: string
			userLogin: string
			currentUserCommentLikeStatus: LikeStatuses
		}

		const commentsRes: DbComment[] = await this.dataSource.query(
			`SELECT *,
(SELECT COUNT(*) as "likesCount" FROM comment_likes cl WHERE cl.status = '${LikeStatuses.Like}' AND cl."commentId" = ${commentId}),
(SELECT COUNT(*) as "dislikesCount" FROM comment_likes cl WHERE  cl.status = '${LikeStatuses.Dislike}' AND cl."commentId" = ${commentId}),
(SELECT login as "userLogin" FROM public."user" u WHERE u.id = c."userId"),
(SELECT status as "currentUserCommentLikeStatus" FROM comment_likes cl WHERE cl."userId" = ${userId || 0} AND cl."commentId" = c.id)
FROM comment c WHERE id=${commentId}`,
			[],
		)

		if (!commentsRes.length) {
			return null
		}

		const comment = commentsRes[0]

		return {
			id: comment.id.toString(),
			content: comment.content,
			commentatorInfo: {
				userId: comment.userId.toString(),
				userLogin: comment.userLogin,
			},
			createdAt: comment.createdAt,
			likesInfo: {
				likesCount: +comment.likesCount,
				dislikesCount: +comment.dislikesCount,
				myStatus: comment.currentUserCommentLikeStatus ?? LikeStatuses.None,
			},
		}
	}

	async getPostComments(
		userId: undefined | string,
		postId: string,
		query: GetPostCommentsQueries,
	): Promise<GetPostCommentsResult> {
		const sortBy = query.sortBy ?? 'createdAt'
		const sortDirection = query.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const post = await this.dataSource.getRepository(Post).findOneBy({ id: postId })

		if (!post) {
			return {
				status: 'postNotFound',
			}
		}

		const totalPostCommentsCount = await this.dataSource
			.getRepository(Comment)
			.count({ where: { post } })

		const pagesCount = Math.ceil(totalPostCommentsCount / pageSize)

		let queryStr = `SELECT *,
		(SELECT COUNT(*) as likescount FROM comment_likes cl WHERE c.id = cl."commentId" AND cl.status = '${LikeStatuses.Like}'),
		(SELECT COUNT(*) as dislikescount FROM comment_likes cl WHERE c.id = cl."commentId" AND cl.status = '${LikeStatuses.Dislike}'),
		(SELECT login as userlogin FROM public."user" u WHERE u.id = c."userId")`

		if (userId) {
			queryStr += `, (SELECT status as currentusercommentlikestatus FROM comment_likes cl WHERE c.id = cl."commentId" AND cl."userId" = ${userId})`
		} else {
			queryStr += `, (SELECT '${LikeStatuses.None}' as currentusercommentlikestatus)`
		}

		queryStr += ` FROM comment c WHERE c."postId" = ${postId} ORDER BY c."${sortBy}" COLLATE "C" ${sortDirection} LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`

		type RawComment = {
			id: string
			content: string
			postId: string
			userId: string
			userlogin: string
			createdAt: string
			likescount: string
			dislikescount: string
			currentusercommentlikestatus: null | LikeStatuses
		}

		const getPostCommentsRes: RawComment[] = await this.dataSource.query(queryStr, [])

		const preparedComments: CommentOutModel[] = getPostCommentsRes.map((comment) => {
			return {
				id: comment.id.toString(),
				content: comment.content,
				commentatorInfo: {
					userId: comment.userId.toString(),
					userLogin: comment.userlogin,
				},
				createdAt: comment.createdAt,
				likesInfo: {
					likesCount: +comment.likescount,
					dislikesCount: +comment.dislikescount,
					myStatus: comment.currentusercommentlikestatus ?? LikeStatuses.None,
				},
			}
		})

		return {
			status: 'success',
			data: {
				pagesCount,
				page: pageNumber,
				pageSize,
				totalCount: +totalPostCommentsCount,
				items: preparedComments,
			},
		}
	}

	mapDbCommentToOutputComment(
		DbComment: Comment,
		likesCount: number,
		dislikesCount: number,
		currentUserCommentLikeStatus: LikeStatuses,
	): CommentOutModel {
		return {
			id: DbComment.id.toString(),
			content: DbComment.content,
			commentatorInfo: {
				userId: DbComment.userId.toString(),
				userLogin: DbComment.user.login,
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
