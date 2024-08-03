import { Injectable } from '@nestjs/common'
import { SaQuestionsRepository } from '../saQuestionsRepository'

@Injectable()
export class DeleteQuizQuestionUseCase {
	constructor(private saQuizQuestionsRepository: SaQuestionsRepository) {}

	async execute(quizQuestionId: string) {
		return this.saQuizQuestionsRepository.deleteGameQuestion(quizQuestionId)
	}
}
