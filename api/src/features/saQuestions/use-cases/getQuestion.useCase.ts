import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import { GetQuestionOutModel } from '../models/questions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'

@Injectable()
export class GetQuestionUseCase {
	constructor(private saQuestionsQueryRepository: SaQuestionsQueryRepository) {}

	async execute(questionId: string): Promise<LayerResult<GetQuestionOutModel>> {
		const getQuestionRes = await this.saQuestionsQueryRepository.getQuizQuestionById(questionId)

		return getQuestionRes
	}
}
