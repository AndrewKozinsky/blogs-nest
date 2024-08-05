import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import { CreateQuestionDtoModel, UpdateQuestionDtoModel } from '../models/quizQuestions.input.model'
import { QuizQuestionOutModel } from '../models/quizQuestions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'
import { SaQuestionsRepository } from '../saQuestionsRepository'

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
