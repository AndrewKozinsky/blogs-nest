import { IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateCommentDtoModel {
	@IsString({ message: 'Content must be a string' })
	@MinLength(20, { message: 'Content is too short' })
	@MaxLength(300, { message: 'Content is too long' })
	content: string
}
