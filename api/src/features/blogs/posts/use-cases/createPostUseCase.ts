import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../../db/mongo/dbTypes'
import { BlogsRepository } from '../../blogs/blogsRepository'
import { CreatePostDtoModel } from '../model/posts.input.model'
import { PostOutModel } from '../model/posts.output.model'
import { PostsRepository } from '../postsRepository'

@Injectable()
export class CreatePostUseCase {
	constructor(
		private blogsRepository: BlogsRepository,
		private postsRepository: PostsRepository,
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
