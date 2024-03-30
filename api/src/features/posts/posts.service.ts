import { Injectable } from '@nestjs/common'
import { ObjectId } from 'mongodb'
import { DBTypes } from '../../db/dbTypes'
import { LayerResult, LayerResultCode } from '../../types/resultCodes'
import { BlogsRepository } from '../blogs/blogs.repository'
import { CommentsRepository } from '../comments/comments.repository'
import { PostLikesRepository } from '../postLikes/postLikes.repository'
import { UserServiceModel } from '../users/models/users.service.model'
import {
	CreatePostCommentDtoModel,
	CreatePostDtoModel,
	UpdatePostDtoModel,
} from './model/posts.input.model'
import { PostOutModel } from './model/posts.output.model'
import { PostsRepository } from './posts.repository'

@Injectable()
export class PostsService {
	constructor(
		private blogsRepository: BlogsRepository,
		private postsRepository: PostsRepository,
		private commentsRepository: CommentsRepository,
		private postLikesRepository: PostLikesRepository,
	) {}

	async createPost(dto: CreatePostDtoModel): Promise<string> {
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

	async updatePost(postId: string, updatePostDto: UpdatePostDtoModel) {
		return this.postsRepository.updatePost(postId, updatePostDto)
	}

	async deletePost(postId: string): Promise<boolean> {
		return this.postsRepository.deletePost(postId)
	}

	async createPostComment(
		postId: string,
		commentDto: CreatePostCommentDtoModel,
		user: UserServiceModel,
	): Promise<'postNotExist' | string> {
		if (!ObjectId.isValid(postId)) {
			return 'postNotExist'
		}

		const post = await this.postsRepository.getPostById(postId)
		if (!post) return 'postNotExist'

		return await this.commentsRepository.createPostComment(user, postId, commentDto)
	}

	async setPostLikeStatus(
		user: UserServiceModel,
		postId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<LayerResult<null>> {
		const post = await this.postsRepository.getPostById(postId)
		if (!post) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		// Find post like status object if it exists
		const postLike = await this.postLikesRepository.getPostLikeByUser(user.id, postId)

		if (postLike) {
			await this.postLikesRepository.updatePostLike(user.id, postId, likeStatus)
		} else {
			await this.postLikesRepository.createPostLike(user.id, postId, likeStatus)
		}

		return {
			code: LayerResultCode.Success,
		}
	}
}
