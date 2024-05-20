import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { Blog, BlogDocument } from '../../../db/mongo/schemas/blog.schema'
import { convertToNumber } from '../../../utils/numbers'
import { CreateBlogDtoModel, UpdateBlogDtoModel } from './model/blogs.input.model'
import { GetBlogOutModel as CreateBlogOutModel } from './model/blogs.output.model'
import { BlogServiceModel } from './model/blogs.service.model'

@Injectable()
export class BlogsRepository {
	constructor(
		@InjectModel(Blog.name) private BlogModel: Model<Blog>,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	/*async getBlogs() {
		const getBlogsRes = await this.BlogModel.find({}).lean()

		return getBlogsRes.map(this.mapDbBlogToServiceBlog)
	}*/

	async getBlogById(blogId: string) {
		if (!ObjectId.isValid(blogId)) {
			return null
		}

		const getBlogRes = await this.BlogModel.findOne({ _id: new ObjectId(blogId) })

		return getBlogRes ? this.mapDbBlogToServiceBlog(getBlogRes) : null
	}

	async createBlog(dto: CreateBlogDtoModel) {
		// Current data like '2024-05-19T14:36:40.112Z'
		const createdAt = new Date().toISOString()

		// Insert new blog and get an array like this: [ { id: 10 } ]
		const newBlogsIdRes = await this.dataSource.query(
			`INSERT INTO blogs
			("name", "description", "websiteurl", "createdat", "ismembership")
			VALUES($1, $2, $3, $4, $5) RETURNING id`,
			[dto.name, dto.description, dto.websiteUrl, createdAt, '0'],
		)

		return newBlogsIdRes[0].id
	}

	async createBlogByMongo(dto: CreateBlogOutModel) {
		const createBlogRes = await this.BlogModel.create({ ...dto, isMembership: false })

		return createBlogRes.id
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

	/*async updateBlogByMongo(blogId: string, updateBlogDto: UpdateBlogDtoModel): Promise<boolean> {
		if (!ObjectId.isValid(blogId)) {
			return false
		}

		const updateBlogRes = await this.BlogModel.updateOne(
			{ _id: new ObjectId(blogId) },
			{ $set: updateBlogDto },
		)

		return updateBlogRes.modifiedCount === 1
	}*/

	async deleteBlog(blogId: string): Promise<boolean> {
		const blogIdNum = convertToNumber(blogId)
		if (!blogIdNum) {
			return false
		}

		// The query will return an array where the second element is a number of deleted documents
		// [ [], 1 ]
		const deleteBlogRes = await this.dataSource.query(
			`DELETE FROM blogs WHERE id='${+blogIdNum}'`,
			[],
		)

		return deleteBlogRes[1] === 1
	}

	/*async deleteBlogByMongo(blogId: string): Promise<boolean> {
		if (!ObjectId.isValid(blogId)) {
			return false
		}

		const result = await this.BlogModel.deleteOne({ _id: new ObjectId(blogId) })

		return result.deletedCount === 1
	}*/

	mapDbBlogToServiceBlog(DbBlog: BlogDocument): BlogServiceModel {
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
