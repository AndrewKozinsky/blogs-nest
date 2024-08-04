import { IsString, MinLength } from 'class-validator'
import { Trim } from '../../../infrastructure/pipes/Trim.decorator'

export class AnswerGameQuestionDtoModel {
	@IsString({ message: 'Answer must be a string' })
	@Trim()
	@MinLength(1, { message: 'Answer is too short' })
	answer: string
}
