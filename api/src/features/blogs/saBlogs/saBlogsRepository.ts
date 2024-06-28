import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { PGGetBlogQuery } from '../../../db/pg/getPgDataTypes'
import { CreateBlogDtoModel } from './model/blogs.input.model'
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

	// DELETE !!!
	/*async createBlog(dto: CreateBlogDtoModel) {
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
