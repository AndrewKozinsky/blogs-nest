import { Injectable } from '@nestjs/common'
import { CreateBlogPostDtoModel } from '../../../../models/blogs/blogs.input.model'
import { CreatePostDtoModel } from '../../../../models/posts/posts.input.model'
import { CreatePostUseCase } from '../../posts/use-cases/createPostUseCase'

@Injectable()
export class CreateBlogPostUseCase {
	constructor(private createPostUseCase: CreatePostUseCase) {}

	async execute(blogId: string, postDto: CreateBlogPostDtoModel) {
		const newPostDto: CreatePostDtoModel = { blogId, ...postDto }
		return this.createPostUseCase.execute(newPostDto)
	}
}
