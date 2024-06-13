import { InjectDataSource } from '@nestjs/typeorm'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Post } from '../../../db/mongo/schemas/post.schema'
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
	constructor(@InjectDataSource() private dataSource: DataSource) {}

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
	}

	async getPost(userId: undefined | string, postId: string): Promise<null | GetPostOutModel> {
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
	}

	async getNewestPostLikes(postId: string): Promise<NewestLike[]> {
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
	}

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
