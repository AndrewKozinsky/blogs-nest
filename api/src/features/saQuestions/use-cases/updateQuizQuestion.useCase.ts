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
export class UpdateQuizQuestionUseCase {
	constructor(private saQuizQuestionsRepository: SaQuestionsRepository) {}

	async execute(
		quizQuestionId: string,
		dto: UpdateQuizQuestionDtoModel,
	): Promise<LayerResult<boolean>> {
		const updatedQuizQuestionRes = await this.saQuizQuestionsRepository.updateGameQuestion(
			quizQuestionId,
			dto,
		)

		return updatedQuizQuestionRes
	}
}
