import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Blog } from '../../../db/pg/entities/blog'
import { PGGetBlogQuery } from '../../../db/pg/getPgDataTypes'
import { CreateBlogDtoModel, UpdateBlogDtoModel } from './model/blogs.input.model'
import { BlogServiceModel } from './model/blogs.service.model'

@Injectable()
export class BlogsRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		@InjectRepository(Blog) private readonly blogsTypeORM: Repository<Blog>,
	) {}

	async getBlogById(blogId?: string) {
		if (!blogId) {
			return null
		}

		const blogs = await this.blogsTypeORM.findBy({ id: blogId })

		if (!blogs.length) {
			return null
		}

		return this.mapDbBlogToServiceBlog(blogs[0])
	}

	/*async getBlogByIdNative(blogId?: string) {
		if (!blogId) {
			return null
		}

		const blogsRes = await this.dataSource.query('SELECT * FROM blogs WHERE id=$1', [+blogId])

		if (!blogsRes.length) {
			return null
		}

		return this.mapDbBlogToServiceBlog(blogsRes[0])
	}*/

	async createBlog(dto: CreateBlogDtoModel) {
		// Current date like '2024-05-19T14:36:40.112Z'
		const createdAt = new Date().toISOString()

		const queryRes = await this.blogsTypeORM.save({
			name: dto.name,
			description: dto.description,
			websiteUrl: dto.websiteUrl,
			createdAt,
			isMembership: false,
		})

		return queryRes.id
	}

	/*async createBlogNative(dto: CreateBlogDtoModel) {
		// Current data like '2024-05-19T14:36:40.112Z'
		const createdAt = new Date().toISOString()

		// Insert new blog and to get an array like this: [ { id: 10 } ]
		const newBlogsIdRes = await this.dataSource.query(
			`INSERT INTO blogs
			("name", "description", "websiteurl", "createdat", "ismembership")
			VALUES($1, $2, $3, $4, $5) RETURNING id`,
			[dto.name, dto.description, dto.websiteUrl, createdAt, '0'],
		)

		return newBlogsIdRes[0].id
	}*/

	async updateBlog(blogId: string, updateBlogDto: UpdateBlogDtoModel): Promise<boolean> {
		const updateBlogRes = await this.blogsTypeORM.update(blogId, updateBlogDto)

		return updateBlogRes.affected == 1
	}

	/*async updateBlogNative(blogId: string, updateBlogDto: UpdateBlogDtoModel): Promise<boolean> {
		const blogIdNum = convertToNumber(blogId)
		if (!blogIdNum || !Object.keys(updateBlogDto).length) {
			return false
		}

		let updateQueryStr = 'UPDATE blogs SET '

		const updateQueryStrParams = Object.keys(updateBlogDto).map((updateBlogParamKey) => {
			// @ts-ignore
			return updateBlogParamKey + ' = ' + `'${updateBlogDto[updateBlogParamKey]}'`
		})
		updateQueryStr += updateQueryStrParams.join(', ')
		updateQueryStr += ` WHERE id = ${blogIdNum};`

		// The query will return an array where the second element is a number of updated documents
		// [ [], 1 ]
		const updateBlogRes = await this.dataSource.query(updateQueryStr, [])

		return updateBlogRes[1] === 1
	}*/

	async deleteBlog(blogId: string): Promise<boolean> {
		const deleteBlogRes = await this.blogsTypeORM.delete(blogId)

		return deleteBlogRes.affected === 1
	}

	/*async deleteBlogNative(blogId: string): Promise<boolean> {
		const blogIdNum = convertToNumber(blogId)
		if (!blogIdNum) {
			return false
		}

		// The query will return an array where the second element is a number of deleted documents
		// [ [], 1 ]
		const deleteBlogRes = await this.dataSource.query(
			`DELETE FROM blogs WHERE id='${blogIdNum}'`,
			[],
		)

		return deleteBlogRes[1] === 1
	}*/

	mapDbBlogToServiceBlog(DbBlog: Blog): BlogServiceModel {
		return {
			id: DbBlog.id,
			name: DbBlog.name,
			description: DbBlog.description,
			websiteUrl: DbBlog.websiteUrl,
			createdAt: DbBlog.createdAt,
			isMembership: DbBlog.isMembership,
		}
	}
}
