import { injectable } from 'inversify'
import { ObjectId, WithId } from 'mongodb'
import { PostModel } from '../db/dbMongoose'
import { DBTypes } from '../db/dbTypes'
import { UpdatePostDtoModel } from '../models/input/posts.input.model'
import { CreatePostOutModel } from '../models/output/posts.output.model'
import { PostServiceModel } from '../models/service/posts.service.model'

@injectable()
export class PostsRepository {
	/*async getPosts() {
		const getPostsRes = await PostModel.find({}).lean()
		return getPostsRes.map(this.mapDbPostToClientPost)
	}*/

	async getPostById(postId: string) {
		if (!ObjectId.isValid(postId)) {
			return null
		}

		const getPostRes = await PostModel.findOne({ _id: new ObjectId(postId) }).lean()

		return getPostRes ? this.mapDbPostToClientPost(getPostRes) : null
	}

	async createPost(dto: CreatePostOutModel) {
		const createdPostRes = await PostModel.create(dto)
		return createdPostRes.id
	}

	async updatePost(postId: string, updatePostDto: UpdatePostDtoModel): Promise<boolean> {
		if (!ObjectId.isValid(postId)) {
			return false
		}

		const updatePostRes = await PostModel.updateOne(
			{ _id: new ObjectId(postId) },
			{ $set: updatePostDto },
		)

		return updatePostRes.modifiedCount === 1
	}

	async deletePost(postId: string): Promise<boolean> {
		if (!ObjectId.isValid(postId)) {
			return false
		}

		const result = await PostModel.deleteOne({ _id: new ObjectId(postId) })

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
