import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import {
	CreateQuestionDtoModel,
	PublishQuestionDtoModel,
	UpdateQuestionDtoModel,
} from '../../../models/saQuestions/questions.input.model'
import { QuestionOutModel } from '../../../models/saQuestions/questions.output.model'
import { SaQuestionsQueryRepository } from '../../../repositories/game/saQuestions.queryRepository'
import { SaQuestionsRepository } from '../../../repositories/game/saQuestions.repository'

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
