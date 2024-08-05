import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import {
	CreateQuestionDtoModel,
	PublishQuestionDtoModel,
	UpdateQuestionDtoModel,
} from '../models/quizQuestions.input.model'
import { QuizQuestionOutModel } from '../models/quizQuestions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'
import { SaQuestionsRepository } from '../saQuestionsRepository'

@Injectable()
export class PublishQuestionUseCase {
	constructor(private saQuizQuestionsRepository: SaQuestionsRepository) {}

	async execute(questionId: string, dto: PublishQuestionDtoModel): Promise<LayerResult<boolean>> {
		const publishQuestionRes = await this.saQuizQuestionsRepository.setPublishStatusInQuestion(
			questionId,
			dto,
		)

		return publishQuestionRes
	}
}
