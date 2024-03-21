import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { ObjectId } from 'mongodb'
import { DBTypes } from '../../db/dbTypes'
import { Blog, BlogDocument } from '../../db/schemas/blog.schema'
import { Post } from '../../db/schemas/post.schema'
import { PostOutModel } from '../posts/model/posts.output.model'
import { PostsQueryRepository } from '../posts/posts.queryRepository'
import { GetBlogPostsQueries, GetBlogsQueries } from './model/blogs.input.model'
import {
	BlogOutModel,
	GetBlogOutModel,
	GetBlogPostsOutModel,
	GetBlogsOutModel,
} from './model/blogs.output.model'

@Injectable()
export class BlogsQueryRepository {
	constructor(
		@InjectModel(Blog.name) private BlogModel: Model<Blog>,
		@InjectModel(Post.name) private PostModel: Model<Post>,
		private postsQueryRepository: PostsQueryRepository,
	) {}

	async getBlogs(query: GetBlogsQueries): Promise<GetBlogsOutModel> {
		const filter: FilterQuery<DBTypes.Blog> = {}

		if (query.searchNameTerm) {
			filter.name = { $regex: new RegExp(query.searchNameTerm, 'i') }
		}

		const sortBy = query.sortBy ?? 'createdAt'
		const sortDirection = query.sortDirection ?? 'desc'
		const sort = { [sortBy]: sortDirection }

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const totalBlogsCount = await this.BlogModel.countDocuments(filter)
		const pagesCount = Math.ceil(totalBlogsCount / pageSize)

		const getBlogsRes = await this.BlogModel.find(filter)
			.sort(sort)
			.skip((pageNumber - 1) * pageSize)
			.limit(pageSize)
			.lean()

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: totalBlogsCount,
			items: getBlogsRes.map(this.mapDbBlogToOutputBlog),
		}
	}

	async getBlogPosts(
		userId: undefined | string,
		blogId: string,
		queries: GetBlogPostsQueries,
	): Promise<GetBlogPostsOutModel> {
		const filter: FilterQuery<PostOutModel> = {
			blogId,
		}

		const pageNumber = queries.pageNumber ? +queries.pageNumber : 1
		const pageSize = queries.pageSize ? +queries.pageSize : 10

		const totalBlogPostsCount = await this.PostModel.countDocuments(filter)
		const pagesCount = Math.ceil(totalBlogPostsCount / pageSize)

		const blogPosts = await this.postsQueryRepository.getPosts(userId, queries, blogId)

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: totalBlogPostsCount,
			items: blogPosts.items,
		}
	}

	async getBlog(blogId: string): Promise<null | GetBlogOutModel> {
		if (!ObjectId.isValid(blogId)) {
			return null
		}

		const getBlogRes = await this.BlogModel.findOne({ _id: new ObjectId(blogId) })

		return getBlogRes ? this.mapDbBlogToOutputBlog(getBlogRes) : null
	}

	mapDbBlogToOutputBlog(DbBlog: BlogDocument): BlogOutModel {
		return {
			id: DbBlog._id.toString(),
			name: DbBlog.name,
			description: DbBlog.description,
			websiteUrl: DbBlog.websiteUrl,
			createdAt: DbBlog.createdAt,
			isMembership: DbBlog.isMembership,
		}
	}
}
