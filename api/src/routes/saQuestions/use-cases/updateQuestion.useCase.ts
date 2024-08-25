import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import {
	CreateQuestionDtoModel,
	UpdateQuestionDtoModel,
} from '../../../models/saQuestions/questions.input.model'
import { QuestionOutModel } from '../../../models/saQuestions/questions.output.model'
import { SaQuestionsQueryRepository } from '../../../repositories/game/saQuestions.queryRepository'
import { SaQuestionsRepository } from '../../../repositories/game/saQuestions.repository'

@Injectable()
export class UpdateQuestionUseCase {
	constructor(private saQuizQuestionsRepository: SaQuestionsRepository) {}

	async execute(
		quizQuestionId: string,
		dto: UpdateQuestionDtoModel,
	): Promise<LayerResult<boolean>> {
		const updatedQuizQuestionRes = await this.saQuizQuestionsRepository.updateQuestion(
			quizQuestionId,
			dto,
		)

		return updatedQuizQuestionRes
	}
}
