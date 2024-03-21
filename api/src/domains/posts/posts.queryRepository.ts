import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../db/dbTypes'
import { Post, PostDocument } from '../../db/schemas/post.schema'
import { PostLike } from '../../db/schemas/PostLike.schema'
import { PostLikesRepository } from '../postLikes/postLikes.repository'
import { UsersRepository } from '../users/users.repository'
import { GetPostsQueries } from './model/posts.input.model'
import {
	GetPostOutModel,
	GetPostsOutModel,
	NewestLike,
	PostOutModel,
} from './model/posts.output.model'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { ObjectId } from 'mongodb'
// import { DBTypes } from '../../db/dbTypes'
// import { Blog, BlogDocument } from '../../db/schemas/blog.schema'
// import { PostOutModel } from '../../posts/model/posts.output.model'
// import { GetBlogPostsQueries, GetBlogsQueries } from './model/blogs.input.model'
// import {
// 	BlogOutModel,
// 	GetBlogOutModel,
// 	GetBlogPostsOutModel,
// 	GetBlogsOutModel,
// } from './model/blogs.output.model'

@Injectable()
export class PostsQueryRepository {
	constructor(
		@InjectModel(Post.name) private PostModel: Model<Post>,
		@InjectModel(PostLike.name) private PostLikeModel: Model<PostLike>,
		private postLikesRepository: PostLikesRepository,
		private usersRepository: UsersRepository,
	) {}

	async getPosts(
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
	}

	async getPost(userId: undefined | string, postId: string): Promise<null | GetPostOutModel> {
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
	}

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
					login: userRes!.account.login,
				}
			}),
		)
	}

	mapDbPostToOutputPost(
		DbPost: PostDocument,
		likesCount: number,
		dislikesCount: number,
		currentUserCommentLikeStatus: DBTypes.LikeStatuses,
		newestLikes: NewestLike[],
	): PostOutModel {
		return {
			id: DbPost._id.toString(),
			title: DbPost.title,
			shortDescription: DbPost.shortDescription,
			content: DbPost.content,
			blogId: DbPost.blogId,
			blogName: DbPost.blogName,
			createdAt: DbPost.createdAt,
			extendedLikesInfo: {
				likesCount,
				dislikesCount,
				myStatus: currentUserCommentLikeStatus,
				newestLikes,
			},
		}
	}
}
