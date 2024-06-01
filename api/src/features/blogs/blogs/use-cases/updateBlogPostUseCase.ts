import { Injectable } from '@nestjs/common'
import { UpdatePostDtoModel } from '../../posts/model/posts.input.model'
import { PostsRepository } from '../../posts/postsRepository'
import { UpdateBlogPostDtoModel } from '../../saBlogs/model/blogs.input.model'

@Injectable()
export class UpdateBlogPostUseCase {
	constructor(private postsRepository: PostsRepository) {}

	async execute(postId: string, dto: UpdatePostDtoModel): Promise<boolean> {
		return this.postsRepository.updatePost(postId, dto)
	}
}
