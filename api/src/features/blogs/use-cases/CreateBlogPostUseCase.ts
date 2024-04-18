import { Injectable } from '@nestjs/common'
import { CreatePostDtoModel } from '../../posts/model/posts.input.model'
import { PostsService } from '../../posts/posts.service'
import { CreateBlogPostDtoModel } from '../model/blogs.input.model'

@Injectable()
export class CreateBlogPostUseCase {
	constructor(private postsService: PostsService) {}

	async execute(blogId: string, postDto: CreateBlogPostDtoModel) {
		const newPostDto: CreatePostDtoModel = { blogId, ...postDto }
		return this.postsService.createPost(newPostDto)
	}
}
