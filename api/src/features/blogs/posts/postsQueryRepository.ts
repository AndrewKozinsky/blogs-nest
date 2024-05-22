import { InjectDataSource } from '@nestjs/typeorm'
import { ObjectId } from 'mongodb'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Post, PostDocument } from '../../../db/mongo/schemas/post.schema'
import { PostLike } from '../../../db/mongo/schemas/postLike.schema'
import { PGGetPostQuery } from '../../../db/pg/blogs'
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

	async getPosts(
		userId: undefined | string,
		query: GetPostsQueries,
		blogId?: string,
	): Promise<GetPostsOutModel> {
		/*const filter: FilterQuery<DBTypes.Blog> = {}
		if (blogId) {
			filter.blogId = blogId
		}

		const sortBy = query.sortBy ?? 'createdAt'
		const sortDirection = query.sortDirection ?? 'desc'
		const sort = { [sortBy]: sortDirection }

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

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
		}*/

		// ------

		const sortBy = query.sortBy ?? 'createdAt'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		if (!blogId) {
			const getAllPostsRes = await this.dataSource.query('SELECT COUNT(*) FROM posts', []) // [ { count: '18' } ]
			const totalPostsCount = getAllPostsRes[0].count
			const pagesCount = Math.ceil(totalPostsCount / pageSize)

			return {
				pagesCount,
				page: pageNumber,
				pageSize,
				totalCount: totalPostsCount,
				items: [],
			}
		} else {
			const getAllPostsRes = await this.dataSource.query(
				'SELECT COUNT(*) FROM posts WHERE userid = ${userId}',
				[],
			) // [ { count: '18' } ]
			const totalPostsCount = getAllPostsRes[0].count
			const pagesCount = Math.ceil(totalPostsCount / pageSize)

			const getPostsRes: PGGetPostQuery[] = await this.dataSource.query(
				`SELECT *,
       (SELECT COUNT(*) as likesCount FROM postlikes WHERE p.id = postlikes.postid AND postlikes.status = 'Like'),
       (SELECT COUNT(*) as dislikesCount FROM postlikes WHERE p.id = postlikes.postid AND postlikes.status = 'Dislike')
		FROM posts p WHERE userid = ${userId} ORDER BY ${sortBy} ${sortDirection} LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`,
				[],
			)

			const items = await Promise.all(
				getPostsRes.map(async (post) => {
					const postId = post.id

					let currentUserCommentLikeStatus = DBTypes.LikeStatuses.None
					if (userId) {
						currentUserCommentLikeStatus =
							await this.postLikesRepository.getUserPostLikeStatus(userId, postId)
					}

					const newestPostLikes = await this.getNewestPostLikes(postId)

					return this.mapDbPostToOutputPost(
						post,
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
       (SELECT COUNT(*) as likesCount FROM postlikes WHERE p.id = postlikes.postid AND postlikes.status = 'Like'),
       (SELECT COUNT(*) as dislikesCount FROM postlikes WHERE p.id = postlikes.postid AND postlikes.status = 'Dislike') FROM posts p WHERE p.id=${postId}`,
			[],
		)

		if (!getPostsRes.length) {
			return null
		}

		let currentUserCommentLikeStatus = DBTypes.LikeStatuses.None
		if (userId) {
			currentUserCommentLikeStatus = await this.postLikesRepository.getUserPostLikeStatus(
				userId,
				postId,
			)
		}

		const newestPostLikes = await this.getNewestPostLikes(postId)

		return this.mapDbPostToOutputPost(
			getPostsRes[0],
			currentUserCommentLikeStatus,
			newestPostLikes,
		)
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
	}

	mapDbPostToOutputPost(
		DbPost: PGGetPostQuery,
		currentUserCommentLikeStatus: DBTypes.LikeStatuses,
		newestLikes: NewestLike[],
	): PostOutModel {
		return {
			id: DbPost.id,
			title: DbPost.title,
			shortDescription: DbPost.shortdescription,
			content: DbPost.content,
			blogId: DbPost.blogid,
			blogName: DbPost.blogname,
			createdAt: DbPost.createdat,
			extendedLikesInfo: {
				likesCount: DbPost.likescount,
				dislikesCount: DbPost.dislikescount,
				myStatus: currentUserCommentLikeStatus,
				newestLikes,
			},
		}
	}
}
