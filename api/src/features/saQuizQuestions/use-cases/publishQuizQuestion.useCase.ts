import { Injectable } from '@nestjs/common'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import {
	CreateQuizQuestionDtoModel,
	UpdateQuizQuestionDtoModel,
} from '../models/quizQuestions.input.model'
import { QuizQuestionOutModel } from '../models/quizQuestions.output.model'
import { SaQuizQuestionsQueryRepository } from '../saQuizQuestionsQueryRepository'
import { SaQuizQuestionsRepository } from '../saQuizQuestionsRepository'

@Injectable()
export class PublishQuizQuestionUseCase {
	constructor(private saQuizQuestionsRepository: SaQuizQuestionsRepository) {}

	async execute(quizQuestionId: string): Promise<LayerResult<boolean>> {
		const publishQuizQuestionRes =
			await this.saQuizQuestionsRepository.publishQuizQuestion(quizQuestionId)

		return publishQuizQuestionRes
	}
}
