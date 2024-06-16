import { Inject, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { PGGetBlogQuery } from '../../../db/pg/getPgDataTypes'
import { PostsQueryRepository } from '../posts/postsQueryRepository'
import { GetBlogPostsQueries, GetBlogsQueries } from './model/blogs.input.model'
import { BlogOutModel, GetBlogOutModel, GetBlogPostsOutModel } from './model/blogs.output.model'

@Injectable()
export class SaBlogsQueryRepository {
	constructor(
		private postsQueryRepository: PostsQueryRepository,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	async getBlogPosts(
		userId: undefined | string,
		blogId: string,
		queries: GetBlogPostsQueries,
	): Promise<GetBlogPostsOutModel> {
		// const pageNumber = queries.pageNumber ? +queries.pageNumber : 1
		// const pageSize = queries.pageSize ? +queries.pageSize : 10

		// const blogPostsCountRes = await this.dataSource.query('SELECT COUNT(*) FROM posts', []) // [ { count: '18' } ]
		// const totalBlogPostsCount = blogPostsCountRes[0].count
		// const pagesCount = Math.ceil(totalBlogPostsCount / pageSize)

		// const blogPosts = await this.postsQueryRepository.getPosts(userId, queries, blogId)

		/*return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: +totalBlogPostsCount,
			items: blogPosts.items,
		}*/

		// --
		// @ts-ignore
		return null
	}

	/*async getBlogPostsNative(
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
	}*/

	async getBlog(blogId: string): Promise<null | GetBlogOutModel> {
		// const blogsRes = await this.dataSource.query(`SELECT * FROM blogs WHERE id=${blogId}`, [])

		/*if (!blogsRes.length) {
			return null
		}*/

		// return this.mapDbBlogToOutputBlog(blogsRes[0])

		// --
		// @ts-ignore
		return null
	}

	/*async getBlogNative(blogId: string): Promise<null | GetBlogOutModel> {
		const blogsRes = await this.dataSource.query(`SELECT * FROM blogs WHERE id=${blogId}`, [])

		if (!blogsRes.length) {
			return null
		}

		return this.mapDbBlogToOutputBlog(blogsRes[0])
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
