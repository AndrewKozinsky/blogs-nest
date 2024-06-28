import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, ILike, Repository } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Comment } from '../../../db/pg/entities/comment'
import { CommentLikes } from '../../../db/pg/entities/commentLikes'
import { Post } from '../../../db/pg/entities/post'
import { PostLikes } from '../../../db/pg/entities/postLikes'
import { User } from '../../../db/pg/entities/user'
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
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		// @InjectRepository(Comment) private readonly commentsTypeORM: Repository<Comment>,
	) {}

	async getComment(
		userId: undefined | string,
		commentId: string,
	): Promise<null | GetCommentOutModel> {
		const commentRepo = this.dataSource.getRepository(Comment)
		const commentLikesRepo = this.dataSource.getRepository(CommentLikes)

		const getCommentQuery = commentRepo
			.createQueryBuilder('c')
			.leftJoinAndSelect('c.post', 'post')
			.leftJoinAndSelect('c.user', 'user')
			.where('c.id = :commentId', { commentId })

		const getCommentLikesQuery = commentLikesRepo
			.createQueryBuilder('cl')
			.where('cl.comment = :commentId', { commentId })
			.andWhere('cl.status = :status', { status: DBTypes.LikeStatuses.Like })

		const getCommentDislikesQuery = commentLikesRepo
			.createQueryBuilder('cl')
			.where('cl.comment = :commentId', { commentId })
			.andWhere('cl.status = :status', { status: DBTypes.LikeStatuses.Dislike })

		const getUserCommentLikeQuery = commentLikesRepo
			.createQueryBuilder('cl')
			.where('cl.userId = :userId', { userId })

		const [comment, likesCount, dislikesCount, userLikeStatus] = await Promise.all([
			getCommentQuery.getOne(),
			getCommentLikesQuery.getCount(),
			getCommentDislikesQuery.getCount(),
			getUserCommentLikeQuery.getOne(),
		])

		if (!comment) return null

		let currentUserLikeStatus = DBTypes.LikeStatuses.None
		if (userLikeStatus) {
			currentUserLikeStatus = userLikeStatus.status as DBTypes.LikeStatuses
		}

		return this.mapDbCommentToOutputComment(
			comment,
			likesCount,
			dislikesCount,
			currentUserLikeStatus,
		)
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
		const sortBy = query.sortBy ?? 'createdAt'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

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
		(SELECT COUNT(*) as likescount FROM comment_likes cl WHERE c.id = cl."commentId" AND cl.status = '${DBTypes.LikeStatuses.Like}'),
		(SELECT COUNT(*) as dislikescount FROM comment_likes cl WHERE c.id = cl."commentId" AND cl.status = '${DBTypes.LikeStatuses.Dislike}'),
		(SELECT login as userlogin FROM public."user" u WHERE u.id = c."userId")`

		if (userId) {
			queryStr += `, (SELECT status as currentusercommentlikestatus FROM comment_likes cl WHERE c.id = cl."commentId" AND cl."userId" = ${userId})`
		} else {
			queryStr += `, (SELECT '${DBTypes.LikeStatuses.None}' as currentusercommentlikestatus)`
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
			currentusercommentlikestatus: null | DBTypes.LikeStatuses
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
					myStatus: comment.currentusercommentlikestatus ?? DBTypes.LikeStatuses.None,
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

	mapDbCommentToOutputComment(
		DbComment: Comment,
		likesCount: number,
		dislikesCount: number,
		currentUserCommentLikeStatus: DBTypes.LikeStatuses,
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
