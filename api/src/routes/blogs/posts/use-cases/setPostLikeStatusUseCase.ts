import { Injectable } from '@nestjs/common'
import { LikeStatuses } from '../../../../db/pg/entities/postLikes'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../../types/resultCodes'
import { PostLikesRepository } from '../../../../repositories/postLikes.repository'
import { UserServiceModel } from '../../../../models/users/users.service.model'
import { PostsRepository } from '../../../../repositories/posts.repository'

@Injectable()
export class SetPostLikeStatusUseCase {
	constructor(
		private postsRepository: PostsRepository,
		private postLikesRepository: PostLikesRepository,
	) {}

	async execute(
		user: UserServiceModel,
		postId: string,
		likeStatus: LikeStatuses,
	): Promise<LayerResult<null>> {
		const post = await this.postsRepository.getPostById(postId)
		if (!post) {
			return {
				code: LayerErrorCode.NotFound_404,
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
			code: LayerSuccessCode.Success,
			data: null,
		}
	}
}
