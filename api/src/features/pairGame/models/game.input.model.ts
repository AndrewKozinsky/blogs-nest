import { IsString, MinLength } from 'class-validator'
import { Trim } from '../../../infrastructure/pipes/Trim.decorator'

export class AnswerGameQuestionDtoModel {
	@IsString({ message: 'Name must be a string' })
	@Trim()
	@MinLength(1, { message: 'Name is too short' })
	answer: string
}
