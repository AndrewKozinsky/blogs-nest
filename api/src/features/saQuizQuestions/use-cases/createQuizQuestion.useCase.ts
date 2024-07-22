import { Injectable } from '@nestjs/common'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { CreateQuizQuestionDtoModel } from '../models/quizQuestions.input.model'
import { QuizQuestionOutModel } from '../models/quizQuestions.output.model'
import { SaQuizQuestionsQueryRepository } from '../saQuizQuestionsQueryRepository'
import { SaQuizQuestionsRepository } from '../saQuizQuestionsRepository'

@Injectable()
export class CreateQuizQuestionUseCase {
	constructor(
		private saQuizQuestionsRepository: SaQuizQuestionsRepository,
		private saQuizQuestionsQueryRepository: SaQuizQuestionsQueryRepository,
	) {}

	async execute(dto: CreateQuizQuestionDtoModel): Promise<LayerResult<QuizQuestionOutModel>> {
		const createdQuizQuestionRes = await this.saQuizQuestionsRepository.createQuizQuestion(dto)

		if (
			createdQuizQuestionRes.code !== LayerResultCode.Success ||
			!createdQuizQuestionRes.data
		) {
			return {
				code: LayerResultCode.Forbidden,
			}
		}

		return await this.saQuizQuestionsQueryRepository.getQuizQuestionById(
			createdQuizQuestionRes.data,
		)
	}
}
