import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import {
	CreateQuizQuestionDtoModel,
	UpdateQuizQuestionDtoModel,
} from '../models/quizQuestions.input.model'
import { QuizQuestionOutModel } from '../models/quizQuestions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'
import { SaQuestionsRepository } from '../saQuestionsRepository'

@Injectable()
export class PublishQuizQuestionUseCase {
	constructor(private saQuizQuestionsRepository: SaQuestionsRepository) {}

	async execute(quizQuestionId: string): Promise<LayerResult<boolean>> {
		const publishQuizQuestionRes =
			await this.saQuizQuestionsRepository.publishGameQuestion(quizQuestionId)

		return publishQuizQuestionRes
	}
}
