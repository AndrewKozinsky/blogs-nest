import { Injectable } from '@nestjs/common'
import { DBTypes } from '../../../../db/mongo/dbTypes'
import { LayerResult, LayerResultCode } from '../../../../types/resultCodes'
import { PostLikesMongoRepository } from '../../postLikes/postLikes.mongo.repository'
import { UserServiceModel } from '../../../users/models/users.service.model'
import { PostsMongoRepository } from '../posts.mongo.repository'

@Injectable()
export class SetPostLikeStatusUseCase {
	constructor(
		private postsMongoRepository: PostsMongoRepository,
		private postLikesMongoRepository: PostLikesMongoRepository,
	) {}

	async execute(
		user: UserServiceModel,
		postId: string,
		likeStatus: DBTypes.LikeStatuses,
	): Promise<LayerResult<null>> {
		const post = await this.postsMongoRepository.getPostById(postId)
		if (!post) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		// Find post like status object if it exists
		const postLike = await this.postLikesMongoRepository.getPostLikeByUser(user.id, postId)

		if (postLike) {
			await this.postLikesMongoRepository.updatePostLike(user.id, postId, likeStatus)
		} else {
			await this.postLikesMongoRepository.createPostLike(user.id, postId, likeStatus)
		}

		return {
			code: LayerResultCode.Success,
		}
	}
}
