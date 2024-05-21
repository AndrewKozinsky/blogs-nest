import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { InjectDataSource } from '@nestjs/typeorm'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { DataSource } from 'typeorm'
import { DBTypes } from '../../../db/mongo/dbTypes'
import { Post, PostDocument } from '../../../db/mongo/schemas/post.schema'
import { PGGetPostQuery } from '../../../db/pg/blogs'
import { convertToNumber } from '../../../utils/numbers'
import { CreatePostDtoModel, UpdatePostDtoModel } from './model/posts.input.model'
import { CreatePostOutModel, PostOutModel } from './model/posts.output.model'
import { PostServiceModel } from './model/posts.service.model'

@Injectable()
export class PostsRepository {
	constructor(
		@InjectModel(Post.name) private PostModel: Model<Post>,
		@InjectDataSource() private dataSource: DataSource,
	) {}

	/*async getPosts() {
		const getPostsRes = await this.PostModel.find({}).lean()
		return getPostsRes.map(this.mapDbPostToClientPost)
	}*/

	async getPostById(postId: string) {
		const postIdNum = convertToNumber(postId)
		if (!postIdNum) {
			return null
		}

		const postsRes = await this.dataSource.query(
			`SELECT *, (SELECT 'My blog name' as blogName) FROM posts WHERE id=${postId}`,
			[],
		)

		if (!postsRes.length) {
			return null
		}

		return postsRes ? this.mapDbPostToClientPost(postsRes[0]) : null
	}

	/*async getPostByIdByMongo(postId: string) {
		if (!ObjectId.isValid(postId)) {
			return null
		}

		const getPostRes = await this.PostModel.findOne({ _id: new ObjectId(postId) })

		return getPostRes ? this.mapDbPostToClientPost(getPostRes) : null
	}*/

	async createPost(dto: CreatePostDtoModel) {
		// Current data like '2024-05-19T14:36:40.112Z'
		const createdAt = new Date().toISOString()

		// Insert new blog and to get an array like this: [ { id: 10 } ]
		const newBlogPostIdRes = await this.dataSource.query(
			`INSERT INTO posts
			("title", "shortdescription", "content", "blogid", "createdat")
			VALUES($1, $2, $3, $4, $5) RETURNING id`,
			[dto.title, dto.shortDescription, dto.content, dto.blogId, createdAt],
		)

		return newBlogPostIdRes[0].id
	}

	/*async createPostByMongo(dto: CreatePostOutModel) {
		const createdPostRes = await this.PostModel.create(dto)
		return createdPostRes.id
	}*/

	async updatePost(postId: string, updatePostDto: UpdatePostDtoModel): Promise<boolean> {
		const blogIdNum = convertToNumber(postId)
		if (!blogIdNum) {
			return false
		}

		let updateQueryStr = 'UPDATE posts SET '

		const updateQueryStrParams = Object.keys(updatePostDto).map((updateBlogParamKey) => {
			return (
				// @ts-ignore
				updateBlogParamKey.toLowerCase() + ' = ' + `'${updatePostDto[updateBlogParamKey]}'`
			)
		})
		updateQueryStr += updateQueryStrParams.join(', ')
		updateQueryStr += ` WHERE id = ${blogIdNum};`

		// The query will return an array where the second element is a number of updated documents
		// [ [], 1 ]
		const updatePostRes = await this.dataSource.query(updateQueryStr, [])

		return updatePostRes[1] === 1
	}

	/*async updatePostByMongo(postId: string, updatePostDto: UpdatePostDtoModel): Promise<boolean> {
		if (!ObjectId.isValid(postId)) {
			return false
		}

		const updatePostRes = await this.PostModel.updateOne(
			{ _id: new ObjectId(postId) },
			{ $set: updatePostDto },
		)

		return updatePostRes.modifiedCount === 1
	}*/

	async deletePost(postId: string): Promise<boolean> {
		const postIdNum = convertToNumber(postId)
		if (!postIdNum) {
			return false
		}

		// The query will return an array where the second element is a number of deleted documents
		// [ [], 1 ]
		const deleteBlogRes = await this.dataSource.query(
			`DELETE FROM posts WHERE id='${+postIdNum}'`,
			[],
		)

		return deleteBlogRes[1] === 1
	}

	/*async deletePostByMongo(postId: string): Promise<boolean> {
		if (!ObjectId.isValid(postId)) {
			return false
		}

		const result = await this.PostModel.deleteOne({ _id: new ObjectId(postId) })

		return result.deletedCount === 1
	}*/

	mapDbPostToClientPost(DbPost: PGGetPostQuery): PostServiceModel {
		return {
			id: DbPost.id,
			title: DbPost.title,
			shortDescription: DbPost.shortdescription,
			content: DbPost.content,
			blogId: DbPost.blogid,
			blogName: DbPost.blogname,
			createdAt: DbPost.createdat,
		}
	}
}
