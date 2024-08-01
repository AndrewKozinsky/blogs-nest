import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
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

		if (createdQuizQuestionRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.Forbidden,
			}
		}

		return await this.saQuizQuestionsQueryRepository.getQuizQuestionById(
			createdQuizQuestionRes.data,
		)
	}
}
