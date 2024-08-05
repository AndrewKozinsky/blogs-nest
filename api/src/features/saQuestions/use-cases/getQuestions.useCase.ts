import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import { GetQuestionsQueries } from '../models/quizQuestions.input.model'
import { GetQuizQuestionsOutModel } from '../models/quizQuestions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'

@Injectable()
export class GetQuestionsUseCase {
	constructor(private saQuizQuestionsQueryRepository: SaQuestionsQueryRepository) {}

	async execute(query: GetQuestionsQueries): Promise<LayerResult<GetQuizQuestionsOutModel>> {
		const getQuizQuestionsRes =
			await this.saQuizQuestionsQueryRepository.getQuizQuestions(query)

		return getQuizQuestionsRes
	}
}
