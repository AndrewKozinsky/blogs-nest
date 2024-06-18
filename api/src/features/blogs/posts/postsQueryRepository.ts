import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { Injectable } from '@nestjs/common'
import { DataSource, FindManyOptions, ILike, Repository } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Blog } from '../../../db/pg/entities/blog'
import { Post } from '../../../db/pg/entities/post'
import { PostLikes } from '../../../db/pg/entities/postLikes'
import { User } from '../../../db/pg/entities/user'
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
		@InjectDataSource() private dataSource: DataSource,
		@InjectRepository(Post) private readonly postsTypeORM: Repository<Post>,
	) {}

	async getPosts(
		userId: undefined | string,
		query: GetPostsQueries,
		blogId?: string,
	): Promise<GetPostsOutModel> {
		const sortBy = query.sortBy ?? 'createdAt'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const totalPostsQuery = this.postsTypeORM.createQueryBuilder('post')
		if (blogId) {
			totalPostsQuery.where({ blogId })
		}
		const totalPostsCount = await totalPostsQuery.getCount()

		const pagesCount = Math.ceil(totalPostsCount / pageSize)

		const findPostsOptions: FindManyOptions<Post> = {
			relations: {
				blog: true,
			},
			order: {
				[sortBy]: sortDirection,
			},
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
		}
		if (blogId) {
			findPostsOptions.where = { blogId }
		}

		const posts = await this.postsTypeORM.find(findPostsOptions)

		const allLikes = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.andWhere('pl.status = :status', { status: DBTypes.LikeStatuses.Like })
			.getMany()

		const allDislikes = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.andWhere('pl.status = :status', { status: DBTypes.LikeStatuses.Dislike })
			.getMany()

		const currentUserAllPostLikeStatuses = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.andWhere('pl.userId = :userId', { userId })
			.getMany()

		const items = await Promise.all(
			posts.map(async (post) => {
				const postId = post.id

				const newestPostLikes = await this.getNewestPostLikes(postId)

				const postLikesCount = allLikes.filter((like) => {
					return (like.postId = postId)
				}).length

				const postDislikesCount = allDislikes.filter((dislike) => {
					return (dislike.postId = postId)
				}).length

				const currentUserPostLikeStatuses = currentUserAllPostLikeStatuses.filter(
					(status) => {
						return userId && (status.userId = userId)
					},
				)

				let currentUserPostLikeStatus: DBTypes.LikeStatuses = DBTypes.LikeStatuses.None
				currentUserPostLikeStatuses.forEach((thisStatus) => {
					if (thisStatus.postId === postId && thisStatus.userId === userId) {
						currentUserPostLikeStatus = thisStatus.status as DBTypes.LikeStatuses
					}
				})

				return this.mapDbPostToOutputPost(
					post,
					postLikesCount,
					postDislikesCount,
					currentUserPostLikeStatus,
					newestPostLikes,
				)
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

	/*async getPostsNative(
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

		// let getPostsQueryStr = `SELECT p.*,
		let getPostsQueryStr = `SELECT p.id, p.title, p.shortdescription, p.content, p.createdat, p.blogid,
			(SELECT COUNT(*) as likescount FROM postlikes WHERE postid = p.id AND status = '${DBTypes.LikeStatuses.Like}'),
			(SELECT COUNT(*) as dislikescount FROM postlikes WHERE postid = p.id AND status = '${DBTypes.LikeStatuses.Dislike}'),
			b.name as blogname,
			(SELECT status as currentuserpostlikestatus FROM postlikes WHERE userid = ${userId || 0} AND postid = p.id)
			FROM posts p
			LEFT JOIN blogs b ON p.blogid = b.id
			LEFT JOIN postlikes pl ON p.id = pl.postid`
		if (blogId) getPostsQueryStr += ` WHERE p.blogid = ${blogId}`
		getPostsQueryStr += ` GROUP BY p.id, p.title, p.shortdescription, p.content, p.createdat, p.blogid, b.name
		ORDER BY ${sortBy} ${sortDirection}
		LIMIT ${pageSize}
		OFFSET ${(pageNumber - 1) * pageSize}`

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

	async getPost(userId: undefined | string, postId: string): Promise<null | GetPostOutModel> {
		const post = await this.postsTypeORM
			.createQueryBuilder('p')
			.where('p.id = :id', { id: postId })
			.leftJoinAndSelect('p.blog', 'b')
			.getOne()

		if (!post) return null

		const likesCount = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.where('pl.postId = :id', { id: postId })
			.andWhere('pl.status = :status', { status: DBTypes.LikeStatuses.Like })
			.getCount()

		const dislikesCount = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.where('pl.postId = :id', { id: postId })
			.andWhere('pl.status = :status', { status: DBTypes.LikeStatuses.Dislike })
			.getCount()

		const currentUserPostLike = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.where('pl.userId = :userId', { userId })
			.andWhere('pl.postId = :postId', { postId })
			.getOne()

		let currentUserPostLikeStatus: DBTypes.LikeStatuses = DBTypes.LikeStatuses.None
		if (currentUserPostLike && currentUserPostLike.status) {
			currentUserPostLikeStatus = currentUserPostLike.status as DBTypes.LikeStatuses
		}

		const newestPostLikes = await this.getNewestPostLikes(postId)

		return this.mapDbPostToOutputPost(
			post,
			likesCount,
			dislikesCount,
			currentUserPostLikeStatus,
			newestPostLikes,
		)
	}

	/*async getPostNative(userId: undefined | string, postId: string): Promise<null | GetPostOutModel> {
		const postIdNum = convertToNumber(postId)
		if (!postIdNum) {
			return null
		}

		const getPostsRes = await this.dataSource.query(
			`SELECT *,
       (SELECT COUNT(*) as likescount FROM postlikes WHERE postid = p.id AND status = '${DBTypes.LikeStatuses.Like}'),
       (SELECT COUNT(*) as dislikescount FROM postlikes WHERE postid = p.id AND status = '${DBTypes.LikeStatuses.Dislike}'),
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
	}*/

	async getNewestPostLikes(postId: string): Promise<NewestLike[]> {
		const postLikes = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.where('pl.postId = :postId', { postId })
			.andWhere('pl.status = :status', { status: DBTypes.LikeStatuses.Like })
			.leftJoinAndSelect('pl.user', 'user')
			.getMany()

		return postLikes.map((postLike) => {
			return {
				addedAt: postLike.addedAt,
				userId: postLike.user.id.toString(),
				login: postLike.user.login,
			}
		})
	}

	/*async getNewestPostLikesNative(postId: string): Promise<NewestLike[]> {
		const getPostLikesRes = await this.dataSource.query(
			`SELECT *,
					(SELECT login FROM users WHERE id = pl.userid) as login
					FROM postlikes pl
					WHERE postid = $1 AND status = $2
					ORDER BY "addedat" DESC LIMIT 3`,
			[postId, DBTypes.LikeStatuses.Like],
		)

		return getPostLikesRes.map((postLike: any) => {
			return {
				addedAt: postLike.addedat,
				userId: postLike.userid.toString(),
				login: postLike.login,
			}
		})
	}*/

	mapDbPostToOutputPost(
		DbPost: Post,
		likesCount: number,
		dislikesCount: number,
		currentUserPostLikeStatus: DBTypes.LikeStatuses,
		newestLikes: NewestLike[],
	): PostOutModel {
		return {
			id: DbPost.id.toString(),
			title: DbPost.title,
			shortDescription: DbPost.shortDescription,
			content: DbPost.content,
			blogId: DbPost.blogId.toString(),
			blogName: DbPost.blog.name,
			createdAt: DbPost.createdAt,
			extendedLikesInfo: {
				likesCount: likesCount,
				dislikesCount: dislikesCount,
				myStatus: currentUserPostLikeStatus ?? DBTypes.LikeStatuses.None,
				newestLikes,
			},
		}
	}
}
