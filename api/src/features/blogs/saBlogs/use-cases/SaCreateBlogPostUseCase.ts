import { Injectable } from '@nestjs/common'
import { CreatePostDtoModel } from '../../posts/model/posts.input.model'
import { CreatePostUseCase } from '../../posts/use-cases/createPostUseCase'
import { CreateBlogPostDtoModel } from '../model/blogs.input.model'

@Injectable()
export class SaCreateBlogPostUseCase {
	constructor(private saCreatePostUseCase: CreatePostUseCase) {}

	async execute(blogId: string, postDto: CreateBlogPostDtoModel) {
		const newPostDto: CreatePostDtoModel = { blogId, ...postDto }
		return this.saCreatePostUseCase.execute(newPostDto)
	}
}
