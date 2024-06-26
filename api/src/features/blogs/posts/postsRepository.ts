import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { BlogsRepository } from '../blogs/blogsRepository'
import { Post } from '../../../db/pg/entities/post'
import { CreatePostDtoModel, UpdatePostDtoModel } from './model/posts.input.model'
import { PostServiceModel } from './model/posts.service.model'

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

	/*async getPostByIdNative(postId: string) {
		const postIdNum = convertToNumber(postId)
		if (!postIdNum) {
			return null
		}

		const postsRes = await this.dataSource.query(
			`SELECT *, (SELECT name as blogname from blogs WHERE id = p.blogid) FROM posts p WHERE id=${postId}`,
			[],
		)

		if (!postsRes.length) {
			return null
		}

		return postsRes ? this.mapDbPostToClientPost(postsRes[0]) : null
	}*/

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

	/*async createPostNative(dto: CreatePostDtoModel) {
		// Current data like '2024-05-19T14:36:40.112Z'
		const createdAt = new Date().toISOString()

		// Insert new blog and to get an array like this: [ { id: 10 } ]
		const newBlogPostIdRes = await this.dataSource.query(
			`INSERT INTO posts
			("title", "shortdescription", "content", "blogid", "createdat")
			VALUES($1, $2, $3, $4, $5) RETURNING id`,
			[dto.title, dto.shortDescription, dto.content, dto.blogId, createdAt],
		)

		return newBlogPostIdRes[0].id
	}*/

	async updatePost(postId: string, updatePostDto: UpdatePostDtoModel): Promise<boolean> {
		const getBlogRes = await this.blogsRepository.getBlogById(updatePostDto.blogId)
		if (!getBlogRes) {
			return false
		}

		const updatePostRes = await this.postsTypeORM.update(postId, updatePostDto)

		return updatePostRes.affected == 1
	}

	/*async updatePostNative(postId: string, updatePostDto: UpdatePostDtoModel): Promise<boolean> {
		const getBlogRes = await this.blogsRepository.getBlogById(updatePostDto.blogId)
		if (!getBlogRes) {
			return false
		}

		let updateQueryStr = 'UPDATE posts SET '

		const updateQueryStrParams = Object.keys(updatePostDto).map((updateBlogParamKey) => {
			return (
				// @ts-ignore
				updateBlogParamKey.toLowerCase() + ' = ' + `'${updatePostDto[updateBlogParamKey]}'`
			)
		})
		updateQueryStr += updateQueryStrParams.join(', ')
		updateQueryStr += ` WHERE id = ${postId};`

		// The query will return an array where the second element is a number of updated documents
		// [ [], 1 ]
		const updatePostRes = await this.dataSource.query(updateQueryStr, [])

		return updatePostRes[1] === 1
	}*/

	async deletePost(postId: string): Promise<boolean> {
		const deleteBlogRes = await this.postsTypeORM.delete(postId)

		return deleteBlogRes.affected === 1
	}

	/*async deletePostNative(postId: string): Promise<boolean> {
		const postIdNum = convertToNumber(postId)
		if (!postIdNum) {
			return false
		}

		// The query will return an array where the second element is a number of deleted documents
		// [ [], 1 ]
		const deleteBlogRes = await this.dataSource.query(
			`DELETE FROM posts WHERE id='${postIdNum}'`,
			[],
		)

		return deleteBlogRes[1] === 1
	}*/

	async deleteBlogPost(blogId: string, postId: string): Promise<boolean> {
		const post = await this.getPostById(postId)
		if (!post || post.blogId !== blogId) {
			return false
		}

		return this.deletePost(postId)
	}

	/*async deleteBlogPostNative(blogId: string, postId: string): Promise<boolean> {
		const post = await this.getPostById(postId)
		if (!post || post.blogId !== blogId) {
			return false
		}

		return this.deletePost(postId)
	}*/

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
