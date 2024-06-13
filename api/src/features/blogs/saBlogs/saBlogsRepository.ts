import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { Blog } from '../../../db/mongo/schemas/blog.schema'
import { PGGetBlogQuery } from '../../../db/pg/getPgDataTypes'
import { convertToNumber } from '../../../utils/numbers'
import { CreateBlogDtoModel, UpdateBlogDtoModel } from './model/blogs.input.model'
import { BlogServiceModel } from './model/blogs.service.model'

@Injectable()
export class SaBlogsRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getBlogById(blogId?: string) {
		if (!blogId) {
			return null
		}

		const blogsRes = await this.dataSource.query('SELECT * FROM blogs WHERE id=$1', [+blogId])

		if (!blogsRes.length) {
			return null
		}

		return this.mapDbBlogToServiceBlog(blogsRes[0])
	}

	async createBlog(dto: CreateBlogDtoModel) {
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
	}

	async updateBlog(blogId: string, updateBlogDto: UpdateBlogDtoModel): Promise<boolean> {
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
	}

	async deleteBlog(blogId: string): Promise<boolean> {
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
	}

	mapDbBlogToServiceBlog(DbBlog: PGGetBlogQuery): BlogServiceModel {
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
