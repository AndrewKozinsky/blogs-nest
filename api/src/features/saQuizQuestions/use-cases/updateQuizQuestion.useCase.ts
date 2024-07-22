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
export class UpdateQuizQuestionUseCase {
	constructor(private saQuizQuestionsRepository: SaQuizQuestionsRepository) {}

	async execute(
		quizQuestionId: string,
		dto: UpdateQuizQuestionDtoModel,
	): Promise<LayerResult<boolean>> {
		const updatedQuizQuestionRes = await this.saQuizQuestionsRepository.updateQuizQuestion(
			quizQuestionId,
			dto,
		)

		return updatedQuizQuestionRes
	}
}
