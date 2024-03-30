import { IsEnum, IsString } from 'class-validator'
import { DBTypes } from '../../../db/dbTypes'

export class CommentLikeOperationsDtoModel {
	@IsString({ message: 'LikeStatus must be a string' })
	@IsEnum(DBTypes.LikeStatuses)
	likeStatus: DBTypes.LikeStatuses
}
