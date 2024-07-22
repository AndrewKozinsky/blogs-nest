import { Injectable } from '@nestjs/common'
import { SaQuizQuestionsRepository } from '../saQuizQuestionsRepository'

@Injectable()
export class DeleteQuizQuestionUseCase {
	constructor(private saQuizQuestionsRepository: SaQuizQuestionsRepository) {}

	async execute(quizQuestionId: string) {
		return this.saQuizQuestionsRepository.deleteQuizQuestion(quizQuestionId)
	}
}
