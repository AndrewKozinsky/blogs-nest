import { Injectable } from '@nestjs/common'
import { SaQuestionsRepository } from '../saQuestionsRepository'

@Injectable()
export class DeleteQuestionUseCase {
	constructor(private saQuizQuestionsRepository: SaQuestionsRepository) {}

	async execute(quizQuestionId: string) {
		return this.saQuizQuestionsRepository.deleteQuestion(quizQuestionId)
	}
}
