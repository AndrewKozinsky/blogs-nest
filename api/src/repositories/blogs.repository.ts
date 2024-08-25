import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Blog } from '../db/pg/entities/blog'
import { CreateBlogDtoModel, UpdateBlogDtoModel } from '../models/blogs/blogs.input.model'
import { BlogServiceModel } from '../models/blogs/blogs.service.model'

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

	async updateBlog(blogId: string, updateBlogDto: UpdateBlogDtoModel): Promise<boolean> {
		const updateBlogRes = await this.blogsTypeORM.update(blogId, updateBlogDto)

		return updateBlogRes.affected == 1
	}

	async deleteBlog(blogId: string): Promise<boolean> {
		const deleteBlogRes = await this.blogsTypeORM.delete(blogId)

		return deleteBlogRes.affected === 1
	}

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
