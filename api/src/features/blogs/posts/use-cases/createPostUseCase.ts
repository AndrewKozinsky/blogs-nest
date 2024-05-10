import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../../db/dbTypes'
import { BlogsMongoRepository } from '../../blogs/blogs.mongo.repository'
import { CreatePostDtoModel } from '../model/posts.input.model'
import { PostOutModel } from '../model/posts.output.model'
import { PostsMongoRepository } from '../posts.mongo.repository'

@Injectable()
export class CreatePostUseCase {
	constructor(
		private blogsRepository: BlogsMongoRepository,
		private postsRepository: PostsMongoRepository,
	) {}

	async execute(dto: CreatePostDtoModel): Promise<string> {
		const blog = await this.blogsRepository.getBlogById(dto.blogId)

		const newPostDto: PostOutModel = {
			id: new Date().toISOString(),
			title: dto.title,
			shortDescription: dto.shortDescription,
			content: dto.content,
			blogId: dto.blogId,
			blogName: blog!.name,
			createdAt: new Date().toISOString(),
			extendedLikesInfo: {
				likesCount: 0,
				dislikesCount: 0,
				myStatus: DBTypes.LikeStatuses.None,
				newestLikes: [],
			},
		}

		return await this.postsRepository.createPost(newPostDto)
	}
}
