import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ObjectId } from 'mongodb'
import { FilterQuery, Model } from 'mongoose'
import { Blog, BlogDocument } from '../../db/schemas/blog.schema'
import { GetBlogsQueries, UpdateBlogDtoModel } from './model/blogs.input.model'
import {
	BlogOutModel,
	GetBlogOutModel as CreateBlogOutModel,
	GetBlogsOutModel,
} from './model/blogs.output.model'
import { BlogServiceModel } from './model/blogs.service.model'

@Injectable()
export class BlogsRepository {
	constructor(@InjectModel(Blog.name) private BlogModel: Model<Blog>) {}

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

	async createBlog(dto: CreateBlogOutModel) {
		const createBlogRes = await this.BlogModel.create({ ...dto, isMembership: false })

		return createBlogRes.id
	}

	async updateBlog(blogId: string, updateBlogDto: UpdateBlogDtoModel): Promise<boolean> {
		if (!ObjectId.isValid(blogId)) {
			return false
		}

		const updateBlogRes = await this.BlogModel.updateOne(
			{ _id: new ObjectId(blogId) },
			{ $set: updateBlogDto },
		)

		return updateBlogRes.modifiedCount === 1
	}

	async deleteBlog(blogId: string): Promise<boolean> {
		if (!ObjectId.isValid(blogId)) {
			return false
		}

		const result = await this.BlogModel.deleteOne({ _id: new ObjectId(blogId) })

		return result.deletedCount === 1
	}

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
