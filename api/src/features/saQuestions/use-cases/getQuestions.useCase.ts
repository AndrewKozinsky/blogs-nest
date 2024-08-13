import { Injectable } from '@nestjs/common'
import { LayerResult } from '../../../types/resultCodes'
import { GetQuestionsQueries } from '../models/questions.input.model'
import { GetQuestionsOutModel } from '../models/questions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'

@Injectable()
export class GetQuestionsUseCase {
	constructor(private saQuizQuestionsQueryRepository: SaQuestionsQueryRepository) {}

	async execute(query: GetQuestionsQueries): Promise<LayerResult<GetQuestionsOutModel>> {
		const getQuizQuestionsRes =
			await this.saQuizQuestionsQueryRepository.getQuizQuestions(query)

		return getQuizQuestionsRes
	}
}
