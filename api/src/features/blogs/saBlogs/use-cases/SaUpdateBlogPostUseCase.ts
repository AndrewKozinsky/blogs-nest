import { Injectable } from '@nestjs/common'
import { UpdatePostDtoModel } from '../../posts/model/posts.input.model'
import { PostsRepository } from '../../posts/postsRepository'
import { UpdateBlogPostDtoModel } from '../model/blogs.input.model'

@Injectable()
export class SaUpdateBlogPostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(blogId: string, postId: string, dto: UpdateBlogPostDtoModel): Promise<boolean> {
		const updatePostDto: UpdatePostDtoModel = { blogId, ...dto }

		return this.postsRepository.updatePost(postId, updatePostDto)
	}
}
