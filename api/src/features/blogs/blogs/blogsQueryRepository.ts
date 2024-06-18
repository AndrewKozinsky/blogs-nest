import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, ILike, Repository } from 'typeorm'
import { Blog } from '../../../db/pg/entities/blog'
import { Post } from '../../../db/pg/entities/post'
import { User } from '../../../db/pg/entities/user'
import { PGGetBlogQuery } from '../../../db/pg/getPgDataTypes'
import { PostsQueryRepository } from '../posts/postsQueryRepository'
import { BlogsRepository } from './blogsRepository'
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
		private postsQueryRepository: PostsQueryRepository,
		@InjectDataSource() private dataSource: DataSource,
		@InjectRepository(Blog) private readonly blogsTypeORM: Repository<Blog>,
		@InjectRepository(Post) private readonly postsTypeORM: Repository<Post>,
	) {}

	async getBlogs(query: GetBlogsQueries): Promise<GetBlogsOutModel> {
		const blogName = query.searchNameTerm || ''

		const sortBy = query.sortBy ?? 'createdAt'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const totalBlogsCount = await this.blogsTypeORM
			.createQueryBuilder('blog')
			.where({ name: ILike(`%${blogName}%`) })
			.getCount()

		const pagesCount = Math.ceil(totalBlogsCount / pageSize)

		const blogs = await this.blogsTypeORM.find({
			where: { name: ILike(`%${blogName}%`) },
			order: {
				[sortBy]: sortDirection,
			},
			skip: (pageNumber - 1) * pageSize,
			take: pageSize,
		})

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: +totalBlogsCount,
			items: blogs.map(this.mapDbBlogToOutputBlog),
		}
	}

	/*async getBlogsNative(query: GetBlogsQueries): Promise<GetBlogsOutModel> {
		const blogName = query.searchNameTerm || ''

		const sortBy = query.sortBy ?? 'createdat'
		const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const getBlogsRes = await this.dataSource.query(
			`
			SELECT * FROM blogs
			WHERE name ILIKE '%${blogName}%'
			ORDER BY ${sortBy} COLLATE "C" ${sortDirection}
			LIMIT ${pageSize}
			OFFSET ${(pageNumber - 1) * pageSize}
			`,
			[],
		)

		const blogsCountRes = await this.dataSource.query(
			`SELECT COUNT(*) FROM blogs WHERE name ILIKE '%${blogName}%'`,
			[],
		) // [ { count: '18' } ]
		const totalBlogsCount = +blogsCountRes[0].count
		const pagesCount = Math.ceil(totalBlogsCount / pageSize)

		return {
			pagesCount,
			page: pageNumber,
			pageSize,
			totalCount: +totalBlogsCount,
			items: getBlogsRes.map(this.mapDbBlogToOutputBlog),
		}
	}*/

	async getBlogPosts(
		userId: undefined | string,
		blogId: string,
		queries: GetBlogPostsQueries,
	): Promise<GetBlogPostsOutModel> {
		const pageNumber = queries.pageNumber ? +queries.pageNumber : 1
		const pageSize = queries.pageSize ? +queries.pageSize : 10

		const totalBlogPostsCount = await this.postsTypeORM
			.createQueryBuilder('post')
			.where({ blogId })
			.getCount()

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

	/*async getBlogPostsNative(
		userId: undefined | string,
		blogId: string,
		queries: GetBlogPostsQueries,
	): Promise<GetBlogPostsOutModel> {
		const pageNumber = queries.pageNumber ? +queries.pageNumber : 1
		const pageSize = queries.pageSize ? +queries.pageSize : 10

		const blogPostsCountRes = await this.dataSource.query(
			`SELECT COUNT(*) FROM posts WHERE blogid = ${blogId}`,
			[],
		) // [ { count: '18' } ]
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
		const blog = await this.blogsTypeORM.findOneBy({ id: blogId })
		if (!blog) return null

		return this.mapDbBlogToOutputBlog(blog)
	}

	/*async getBlogNative(blogId: string): Promise<null | GetBlogOutModel> {
		const blogsRes = await this.dataSource.query(`SELECT * FROM blogs WHERE id=${blogId}`, [])

		if (!blogsRes.length) {
			return null
		}

		return this.mapDbBlogToOutputBlog(blogsRes[0])
	}*/

	mapDbBlogToOutputBlog(DbBlog: Blog): BlogOutModel {
		return {
			id: DbBlog.id.toString(),
			name: DbBlog.name,
			description: DbBlog.description,
			websiteUrl: DbBlog.websiteUrl,
			createdAt: DbBlog.createdAt,
			isMembership: DbBlog.isMembership,
		}
	}
}
