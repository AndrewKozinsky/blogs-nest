import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import { GetQuizQuestionsQueries } from '../models/quizQuestions.input.model'
import { GetQuizQuestionsOutModel } from '../models/quizQuestions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'

@Injectable()
export class GetQuizQuestionsUseCase {
	constructor(private saQuizQuestionsQueryRepository: SaQuestionsQueryRepository) {}

	async execute(query: GetQuizQuestionsQueries): Promise<LayerResult<GetQuizQuestionsOutModel>> {
		const getQuizQuestionsRes =
			await this.saQuizQuestionsQueryRepository.getQuizQuestions(query)

		return getQuizQuestionsRes
	}
}
