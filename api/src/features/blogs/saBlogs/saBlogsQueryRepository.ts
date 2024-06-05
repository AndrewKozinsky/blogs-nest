import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { FilterQuery, Model } from 'mongoose'
import { ObjectId } from 'mongodb'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Blog, BlogDocument } from '../../../db/mongo/schemas/blog.schema'
import { Post } from '../../../db/mongo/schemas/post.schema'
import { PGGetBlogQuery } from '../../../db/pg/getPgDataTypes'
import { PostOutModel } from '../posts/model/posts.output.model'
import { PostsQueryRepository } from '../posts/postsQueryRepository'
import { GetBlogPostsQueries, GetBlogsQueries } from './model/blogs.input.model'
import {
	BlogOutModel,
	GetBlogOutModel,
	GetBlogPostsOutModel,
	GetBlogsOutModel,
} from './model/blogs.output.model'

@Injectable()
export class SaBlogsQueryRepository {
	constructor(
		@InjectModel(Blog.name) private BlogModel: Model<Blog>,
		@InjectModel(Post.name) private PostModel: Model<Post>,
		private postsQueryRepository: PostsQueryRepository,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getBlogPosts(
		userId: undefined | string,
		blogId: string,
		queries: GetBlogPostsQueries,
	): Promise<GetBlogPostsOutModel> {
		const pageNumber = queries.pageNumber ? +queries.pageNumber : 1
		const pageSize = queries.pageSize ? +queries.pageSize : 10

		const blogPostsCountRes = await this.dataSource.query('SELECT COUNT(*) FROM posts', []) // [ { count: '18' } ]
		const totalBlogPostsCount = blogPostsCountRes[0].count
		const pagesCount = Math.ceil(totalBlogPostsCount / pageSize)

		const blogPosts = await this.postsQueryRepository.getPosts(userId, queries, blogId)

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: +totalBlogPostsCount,
			items: blogPosts.items,
		}
	}

	async getBlog(blogId: string): Promise<null | GetBlogOutModel> {
		const blogsRes = await this.dataSource.query(`SELECT * FROM blogs WHERE id=${blogId}`, [])

		if (!blogsRes.length) {
			return null
		}

		return this.mapDbBlogToOutputBlog(blogsRes[0])
	}

	/*async getBlogByMongo(blogId: string): Promise<null | GetBlogOutModel> {
		if (!ObjectId.isValid(blogId)) {
			return null
		}

		const getBlogRes = await this.BlogModel.findOne({ _id: new ObjectId(blogId) })

		return getBlogRes ? this.mapDbBlogToOutputBlog(getBlogRes) : null
	}*/

	mapDbBlogToOutputBlog(DbBlog: PGGetBlogQuery): BlogOutModel {
		return {
			id: DbBlog.id.toString(),
			name: DbBlog.name,
			description: DbBlog.description,
			websiteUrl: DbBlog.websiteurl,
			createdAt: DbBlog.createdat,
			isMembership: DbBlog.ismembership,
		}
	}
}