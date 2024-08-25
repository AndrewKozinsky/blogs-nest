import { IsEnum, IsString } from 'class-validator'
import { LikeStatuses } from '../../db/pg/entities/postLikes'

export class CommentLikeOperationsDtoModel {
	@IsString({ message: 'LikeStatus must be a string' })
	@IsEnum(LikeStatuses)
	likeStatus: LikeStatuses
}
