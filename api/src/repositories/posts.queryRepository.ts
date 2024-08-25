import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { Post } from '../db/pg/entities/post'
import { LikeStatuses, PostLikes } from '../db/pg/entities/postLikes'
import { GetPostsQueries } from '../models/posts/posts.input.model'
import {
	GetPostOutModel,
	GetPostsOutModel,
	NewestLike,
	PostOutModel,
} from '../models/posts/posts.output.model'

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
		const sortDirection = query.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		// Get all posts count
		let getAllPostsQueryStr = 'SELECT COUNT(*) FROM post'
		if (blogId) getAllPostsQueryStr += ` WHERE "blogId" = ${blogId}`
		const getAllPostsRes = await this.dataSource.query(getAllPostsQueryStr, []) // [ { count: '18' } ]
		const totalPostsCount = getAllPostsRes[0].count
		const pagesCount = Math.ceil(totalPostsCount / pageSize)

		let getPostsQueryStr = `SELECT p.id, p.title, p."shortDescription", p.content, p."createdAt", p."blogId",
			(SELECT COUNT(*) as "likesCount" FROM post_likes WHERE "postId" = p.id AND status = '${LikeStatuses.Like}'),
			(SELECT COUNT(*) as "dislikesCount" FROM post_likes WHERE "postId" = p.id AND status = '${LikeStatuses.Dislike}'),
			b.name as "blogName",
			(SELECT status as "currentUserPostLikeStatus" FROM post_likes pl WHERE pl."userId" = ${userId || 0} AND pl."postId" = p.id)
			FROM post p
			LEFT JOIN blog b ON p."blogId" = b.id
			LEFT JOIN post_likes pl ON p.id = pl."postId"`
		if (blogId) getPostsQueryStr += ` WHERE p."blogId" = ${blogId}`
		getPostsQueryStr += ` GROUP BY p.id, p.title, p."shortDescription", p.content, p."createdAt", p."blogId", b.name
		ORDER BY "${sortBy}" ${sortDirection}
		LIMIT ${pageSize}
		OFFSET ${(pageNumber - 1) * pageSize}`

		type RawPostType = {
			id: number
			title: string
			shortDescription: string
			content: string
			createdAt: string
			blogId: number
			likesCount: string
			dislikesCount: string
			blogName: string
			currentUserPostLikeStatus: null | LikeStatuses
		}

		const getPostsRes: RawPostType[] = await this.dataSource.query(getPostsQueryStr)

		const items: PostOutModel[] = await Promise.all(
			getPostsRes.map(async (post) => {
				const postId = post.id

				const newestPostLikes = await this.getNewestPostLikes(postId.toString())

				return {
					id: post.id.toString(),
					title: post.title,
					shortDescription: post.shortDescription,
					content: post.content,
					blogId: post.blogId.toString(),
					blogName: post.blogName,
					createdAt: post.createdAt,
					extendedLikesInfo: {
						likesCount: +post.likesCount,
						dislikesCount: +post.dislikesCount,
						myStatus: post.currentUserPostLikeStatus ?? LikeStatuses.None,
						newestLikes: newestPostLikes,
					},
				}
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
			.andWhere('pl.status = :status', { status: LikeStatuses.Like })
			.getCount()

		const dislikesCount = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.where('pl.postId = :id', { id: postId })
			.andWhere('pl.status = :status', { status: LikeStatuses.Dislike })
			.getCount()

		const currentUserPostLike = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.where('pl.userId = :userId', { userId })
			.andWhere('pl.postId = :postId', { postId })
			.getOne()

		let currentUserPostLikeStatus: LikeStatuses = LikeStatuses.None
		if (currentUserPostLike && currentUserPostLike.status) {
			currentUserPostLikeStatus = currentUserPostLike.status as LikeStatuses
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

	async getNewestPostLikes(postId: string): Promise<NewestLike[]> {
		const postLikes = await this.dataSource
			.createQueryBuilder(PostLikes, 'pl')
			.where('pl.postId = :postId', { postId })
			.andWhere('pl.status = :status', { status: LikeStatuses.Like })
			.leftJoinAndSelect('pl.user', 'user')
			.orderBy('pl.addedAt', 'DESC')
			.take(3)
			.getMany()

		return postLikes.map((postLike) => {
			return {
				addedAt: postLike.addedAt,
				userId: postLike.user.id.toString(),
				login: postLike.user.login,
			}
		})
	}

	mapDbPostToOutputPost(
		DbPost: Post,
		likesCount: number,
		dislikesCount: number,
		currentUserPostLikeStatus: LikeStatuses,
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
				myStatus: currentUserPostLikeStatus ?? LikeStatuses.None,
				newestLikes,
			},
		}
	}
}
