import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { CreateQuizQuestionDtoModel } from '../models/quizQuestions.input.model'
import { QuizQuestionOutModel } from '../models/quizQuestions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'
import { SaQuestionsRepository } from '../saQuestionsRepository'

@Injectable()
export class CreateQuizQuestionUseCase {
	constructor(
		private saQuizQuestionsRepository: SaQuestionsRepository,
		private saQuizQuestionsQueryRepository: SaQuestionsQueryRepository,
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
