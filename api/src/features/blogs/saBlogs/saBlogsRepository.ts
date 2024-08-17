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
