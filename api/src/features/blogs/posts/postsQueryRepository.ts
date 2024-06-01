import { InjectDataSource } from '@nestjs/typeorm'
import { ObjectId } from 'mongodb'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Post, PostDocument } from '../../../db/mongo/schemas/post.schema'
import { PostLike } from '../../../db/mongo/schemas/postLike.schema'
import { PGGetPostQuery } from '../../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../../utils/numbers'
import { PostLikesRepository } from '../postLikes/postLikesRepository'
import { UsersRepository } from '../../users/usersRepository'
import { GetPostsQueries } from './model/posts.input.model'
import {
	GetPostOutModel,
	GetPostsOutModel,
	NewestLike,
	PostOutModel,
} from './model/posts.output.model'

@Injectable()
export class PostsQueryRepository {
	constructor(
		@InjectModel(Post.name) private PostModel: Model<Post>,
		@InjectModel(PostLike.name) private PostLikeModel: Model<PostLike>,
		private postLikesRepository: PostLikesRepository,
		private usersRepository: UsersRepository,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	/*async getPosts(
		userId: undefined | string,
		query: GetPostsQueries,
		blogId?: string,
	): Promise<GetPostsOutModel> {
		const sortBy = query.sortBy ?? 'createdat'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		// Get all posts count
		let getAllPostsQueryStr = 'SELECT COUNT(*) FROM posts'
		if (blogId) getAllPostsQueryStr += ` WHERE blogid = ${blogId}`
		const getAllPostsRes = await this.dataSource.query(getAllPostsQueryStr, []) // [ { count: '18' } ]
		const totalPostsCount = getAllPostsRes[0].count
		const pagesCount = Math.ceil(totalPostsCount / pageSize)

		let getPostsQueryStr = `SELECT id, title, shortDescription, content, createdAt, blogId,
		   (SELECT COUNT(*) as likescount FROM postlikes WHERE p.id = postid AND status = 'Like') as likescount,
		   (SELECT COUNT(*) as dislikescount FROM postlikes WHERE p.id = postid AND status = 'Dislike') as dislikescount,
		   (SELECT name as blogname from blogs WHERE id = p.blogid) as blogname,
		   (SELECT status as currentuserpostlikestatus FROM postlikes WHERE userid = ${userId || 0} AND postid = p.id) as currentuserpostlikestatus
			FROM posts p`
		if (blogId) getPostsQueryStr += ` WHERE blogid = ${blogId}`
		getPostsQueryStr += ` ORDER BY ${sortBy} COLLATE "C" ${sortDirection} LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`

		const getPostsRes: PGGetPostQuery[] = await this.dataSource.query(getPostsQueryStr)

		const items = await Promise.all(
			getPostsRes.map(async (post) => {
				const postId = post.id

				const newestPostLikes = await this.getNewestPostLikes(postId)

				return this.mapDbPostToOutputPost(post, newestPostLikes)
			}),
		)

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: +totalPostsCount,
			items,
		}
	}*/
	async getPosts(
		userId: undefined | string,
		query: GetPostsQueries,
		blogId?: string,
	): Promise<GetPostsOutModel> {
		const sortBy = query.sortBy ?? 'createdat'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		// Get all posts count
		let getAllPostsQueryStr = 'SELECT COUNT(*) FROM posts'
		if (blogId) getAllPostsQueryStr += ` WHERE blogid = ${blogId}`
		const getAllPostsRes = await this.dataSource.query(getAllPostsQueryStr, []) // [ { count: '18' } ]
		const totalPostsCount = getAllPostsRes[0].count
		const pagesCount = Math.ceil(totalPostsCount / pageSize)

		let getPostsQueryStr = `SELECT id, title, shortDescription, content, createdAt, blogId,
		   (SELECT COUNT(*) as likescount FROM postlikes WHERE p.id = postid AND status = 'Like') as likescount,
		   (SELECT COUNT(*) as dislikescount FROM postlikes WHERE p.id = postid AND status = 'Dislike') as dislikescount,
		   (SELECT name as blogname from blogs WHERE id = p.blogid) as blogname,
		   (SELECT status as currentuserpostlikestatus FROM postlikes WHERE userid = ${userId || 0} AND postid = p.id) as currentuserpostlikestatus
			FROM posts p`
		if (blogId) getPostsQueryStr += ` WHERE blogid = ${blogId}`
		getPostsQueryStr += ` ORDER BY ${sortBy} COLLATE "C" ${sortDirection} LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`

		const getPostsRes: PGGetPostQuery[] = await this.dataSource.query(getPostsQueryStr)

		const items = await Promise.all(
			getPostsRes.map(async (post) => {
				const postId = post.id

				const newestPostLikes = await this.getNewestPostLikes(postId)

				return this.mapDbPostToOutputPost(post, newestPostLikes)
			}),
		)

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: +totalPostsCount,
			items,
		}
	}

	/*async getPostsByMongo(
		userId: undefined | string,
		queries: GetPostsQueries,
		blogId?: string,
	): Promise<GetPostsOutModel> {
		const filter: FilterQuery<DBTypes.Blog> = {}
		if (blogId) {
			filter.blogId = blogId
		}

		const sortBy = queries.sortBy ?? 'createdAt'
		const sortDirection = queries.sortDirection ?? 'desc'
		const sort = { [sortBy]: sortDirection }

		const pageNumber = queries.pageNumber ? +queries.pageNumber : 1
		const pageSize = queries.pageSize ? +queries.pageSize : 10

		const totalPostsCount = await this.PostModel.countDocuments({})
		const pagesCount = Math.ceil(totalPostsCount / pageSize)

		const getPostsRes = await this.PostModel.find(filter)
			.sort(sort)
			.skip((pageNumber - 1) * pageSize)
			.limit(pageSize)

		const items = await Promise.all(
			getPostsRes.map(async (post) => {
				const postId = post._id.toString()

				const postLikesStatsRes = await this.postLikesRepository.getPostLikesStats(postId)

				let currentUserCommentLikeStatus = DBTypes.LikeStatuses.None
				if (userId) {
					currentUserCommentLikeStatus =
						await this.postLikesRepository.getUserPostLikeStatus(userId, postId)
				}

				const newestPostLikes = await this.getNewestPostLikes(postId)

				return this.mapDbPostToOutputPost(
					post,
					postLikesStatsRes.likesCount,
					postLikesStatsRes.dislikesCount,
					currentUserCommentLikeStatus,
					newestPostLikes,
				)
			}),
		)

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: totalPostsCount,
			items,
		}
	}*/

	async getPost(userId: undefined | string, postId: string): Promise<null | GetPostOutModel> {
		const postIdNum = convertToNumber(postId)
		if (!postIdNum) {
			return null
		}

		const getPostsRes = await this.dataSource.query(
			`SELECT *,
       (SELECT COUNT(*) as likescount FROM postlikes WHERE p.id = postlikes.postid AND postlikes.status = 'Like'),
       (SELECT COUNT(*) as dislikescount FROM postlikes WHERE p.id = postlikes.postid AND postlikes.status = 'Dislike'),
       (SELECT name as blogname from blogs WHERE id = p.blogid),
       (SELECT status as currentuserpostlikestatus FROM postlikes WHERE userid = ${userId || 0} AND postid = p.id)
       FROM posts p WHERE p.id=${postId}`,
			[],
		)

		if (!getPostsRes.length) {
			return null
		}

		const newestPostLikes = await this.getNewestPostLikes(postId)

		return this.mapDbPostToOutputPost(getPostsRes[0], newestPostLikes)
	}

	/*async getPostByMongo(userId: undefined | string, postId: string): Promise<null | GetPostOutModel> {
		if (!ObjectId.isValid(postId)) {
			return null
		}

		const getPostRes = await this.PostModel.findOne({ _id: new ObjectId(postId) })

		const postLikesStatsRes = await this.postLikesRepository.getPostLikesStats(postId)

		let currentUserCommentLikeStatus = DBTypes.LikeStatuses.None
		if (userId) {
			currentUserCommentLikeStatus = await this.postLikesRepository.getUserPostLikeStatus(
				userId,
				postId,
			)
		}

		const newestPostLikes = await this.getNewestPostLikes(postId)

		return getPostRes
			? this.mapDbPostToOutputPost(
				getPostRes,
				postLikesStatsRes.likesCount,
				postLikesStatsRes.dislikesCount,
				currentUserCommentLikeStatus,
				newestPostLikes,
			)
			: null
	}*/

	async getNewestPostLikes(postId: string): Promise<NewestLike[]> {
		const getPostLikesRes = await this.dataSource.query(
			'SELECT *, (SELECT login FROM users WHERE id = pl.userid) FROM postlikes pl WHERE postid = $1 ORDER BY "addedat" DESC LIMIT 3',
			[postId],
		)

		return getPostLikesRes.map((postLike: any) => {
			return {
				addedAt: postLike.addedat,
				userId: postLike.userid.toString(),
				login: postLike.login,
			}
		})
	}

	/*async getNewestPostLikesByMongo(postId: string): Promise<NewestLike[]> {
		const getPostRes = await this.PostLikeModel.find({
			postId,
			status: DBTypes.LikeStatuses.Like,
		})
			.sort({ addedAt: 'desc' })
			.limit(3)
			.lean()

		return await Promise.all(
			getPostRes.map(async (postLike) => {
				const userRes = await this.usersRepository.getUserById(postLike.userId)

				return {
					addedAt: postLike.addedAt,
					userId: postLike.userId,
					// @ts-ignore
					login: userRes!.account.login,
				}
			}),
		)
	}*/

	mapDbPostToOutputPost(DbPost: PGGetPostQuery, newestLikes: NewestLike[]): PostOutModel {
		return {
			id: DbPost.id.toString(),
			title: DbPost.title,
			shortDescription: DbPost.shortdescription,
			content: DbPost.content,
			blogId: DbPost.blogid.toString(),
			blogName: DbPost.blogname,
			createdAt: DbPost.createdat,
			extendedLikesInfo: {
				likesCount: +DbPost.likescount,
				dislikesCount: +DbPost.dislikescount,
				myStatus: (DbPost.currentuserpostlikestatus as any) ?? DBTypes.LikeStatuses.None,
				newestLikes,
			},
		}
	}
}
