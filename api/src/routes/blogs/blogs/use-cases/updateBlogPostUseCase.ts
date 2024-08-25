import { Injectable } from '@nestjs/common'
import { UpdateBlogPostDtoModel } from '../../../../models/blogs/blogs.input.model'
import { UpdatePostDtoModel } from '../../../../models/posts/posts.input.model'
import { PostsRepository } from '../../../../repositories/posts.repository'

@Injectable()
export class UpdateBlogPostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(blogId: string, postId: string, dto: UpdateBlogPostDtoModel): Promise<boolean> {
		const updatePostDt: UpdatePostDtoModel = { ...dto, blogId }
		return this.postsRepository.updatePost(postId, updatePostDt)
	}
}
