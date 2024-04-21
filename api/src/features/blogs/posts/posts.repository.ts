import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { Post, PostDocument } from '../../../db/schemas/post.schema'
import { UpdatePostDtoModel } from './model/posts.input.model'
import { CreatePostOutModel } from './model/posts.output.model'
import { PostServiceModel } from './model/posts.service.model'

@Injectable()
export class PostsRepository {
	constructor(@InjectModel(Post.name) private PostModel: Model<Post>) {}

	/*async getPosts() {
		const getPostsRes = await this.PostModel.find({}).lean()
		return getPostsRes.map(this.mapDbPostToClientPost)
	}*/

	async getPostById(postId: string) {
		if (!ObjectId.isValid(postId)) {
			return null
		}

		const getPostRes = await this.PostModel.findOne({ _id: new ObjectId(postId) })

		return getPostRes ? this.mapDbPostToClientPost(getPostRes) : null
	}

	async createPost(dto: CreatePostOutModel) {
		const createdPostRes = await this.PostModel.create(dto)
		return createdPostRes.id
	}

	async updatePost(postId: string, updatePostDto: UpdatePostDtoModel): Promise<boolean> {
		if (!ObjectId.isValid(postId)) {
			return false
		}

		const updatePostRes = await this.PostModel.updateOne(
			{ _id: new ObjectId(postId) },
			{ $set: updatePostDto },
		)

		return updatePostRes.modifiedCount === 1
	}

	async deletePost(postId: string): Promise<boolean> {
		if (!ObjectId.isValid(postId)) {
			return false
		}

		const result = await this.PostModel.deleteOne({ _id: new ObjectId(postId) })

		return result.deletedCount === 1
	}

	mapDbPostToClientPost(DbPost: PostDocument): PostServiceModel {
		return {
			id: DbPost._id.toString(),
			title: DbPost.title,
			shortDescription: DbPost.shortDescription,
			content: DbPost.content,
			blogId: DbPost.blogId,
			blogName: DbPost.blogName,
			createdAt: DbPost.createdAt,
		}
	}
}
