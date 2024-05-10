import { Injectable } from '@nestjs/common'
import { ObjectId } from 'mongodb'
import { DBTypes } from '../../../../db/dbTypes'
import { LayerResult, LayerResultCode } from '../../../../types/resultCodes'
import { BlogsMongoRepository } from '../../blogs/blogs.mongo.repository'
import { CommentsMongoRepository } from '../../comments/comments.mongo.repository'
import { PostLikesMongoRepository } from '../../postLikes/postLikes.mongo.repository'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { CreatePostCommentDtoModel, CreatePostDtoModel } from '../model/posts.input.model'
import { PostOutModel } from '../model/posts.output.model'
import { PostsMongoRepository } from '../posts.mongo.repository'

@Injectable()
export class SetPostLikeStatusUseCase {
	constructor(
		private postsRepository: PostsMongoRepository,
		private postLikesRepository: PostLikesMongoRepository,
	) {}

	async execute(
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
