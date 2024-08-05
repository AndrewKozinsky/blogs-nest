import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import { GetQuizQuestionOutModel } from '../models/quizQuestions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'

@Injectable()
export class GetQuestionUseCase {
	constructor(private saQuestionsQueryRepository: SaQuestionsQueryRepository) {}

	async execute(questionId: string): Promise<LayerResult<GetQuizQuestionOutModel>> {
		const getQuestionRes = await this.saQuestionsQueryRepository.getQuizQuestionById(questionId)

		return getQuestionRes
	}
}
