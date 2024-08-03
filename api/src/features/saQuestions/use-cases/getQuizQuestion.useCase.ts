import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import { GetQuizQuestionsQueries } from '../models/quizQuestions.input.model'
import {
	GetQuizQuestionOutModel,
	GetQuizQuestionsOutModel,
} from '../models/quizQuestions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'

@Injectable()
export class GetQuizQuestionUseCase {
	constructor(private saQuizQuestionsQueryRepository: SaQuestionsQueryRepository) {}

	async execute(questionId: string): Promise<LayerResult<GetQuizQuestionOutModel>> {
		const getQuizQuestionRes =
			await this.saQuizQuestionsQueryRepository.getQuizQuestionById(questionId)

		return getQuizQuestionRes
	}
}
