import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { BlogsRepository } from './blogs.repository'
import { Post } from '../db/pg/entities/post'
import { CreatePostDtoModel, UpdatePostDtoModel } from '../models/posts/posts.input.model'
import { PostServiceModel } from '../models/posts/posts.service.model'

@Injectable()
export class PostsRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		private blogsRepository: BlogsRepository,
		@InjectRepository(Post) private readonly postsTypeORM: Repository<Post>,
	) {}

	async getPostById(postId: string) {
		const post = await this.postsTypeORM
			.createQueryBuilder('p')
			.leftJoinAndSelect('p.blog', 'blog')
			.where('p.id = :postId', { postId })
			.getOne()

		if (!post) {
			return null
		}

		return post ? this.mapDbPostToClientPost(post) : null
	}

	async createPost(dto: CreatePostDtoModel) {
		// Current data like '2024-05-19T14:36:40.112Z'
		const createdAt = new Date().toISOString()

		const newPostRes = await this.postsTypeORM.insert({
			title: dto.title,
			shortDescription: dto.shortDescription,
			content: dto.content,
			blogId: dto.blogId,
			createdAt: createdAt,
		})

		return newPostRes.identifiers[0].id
	}

	async updatePost(postId: string, updatePostDto: UpdatePostDtoModel): Promise<boolean> {
		const getBlogRes = await this.blogsRepository.getBlogById(updatePostDto.blogId)
		if (!getBlogRes) {
			return false
		}

		const updatePostRes = await this.postsTypeORM.update(postId, updatePostDto)

		return updatePostRes.affected == 1
	}

	async deletePost(postId: string): Promise<boolean> {
		const deleteBlogRes = await this.postsTypeORM.delete(postId)

		return deleteBlogRes.affected === 1
	}

	async deleteBlogPost(blogId: string, postId: string): Promise<boolean> {
		const post = await this.getPostById(postId)
		if (!post || post.blogId !== blogId) {
			return false
		}

		return this.deletePost(postId)
	}

	mapDbPostToClientPost(DbPost: Post): PostServiceModel {
		return {
			id: DbPost.id.toString(),
			title: DbPost.title,
			shortDescription: DbPost.shortDescription,
			content: DbPost.content,
			blogId: DbPost.blogId.toString(),
			blogName: DbPost.blog.name,
			createdAt: DbPost.createdAt,
		}
	}
}
