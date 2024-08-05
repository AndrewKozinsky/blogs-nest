import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { CreateQuestionDtoModel } from '../models/quizQuestions.input.model'
import { QuizQuestionOutModel } from '../models/quizQuestions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'
import { SaQuestionsRepository } from '../saQuestionsRepository'

@Injectable()
export class CreateQuestionUseCase {
	constructor(
		private saQuizQuestionsRepository: SaQuestionsRepository,
		private saQuizQuestionsQueryRepository: SaQuestionsQueryRepository,
	) {}

	async execute(dto: CreateQuestionDtoModel): Promise<LayerResult<QuizQuestionOutModel>> {
		const createdQuizQuestionRes = await this.saQuizQuestionsRepository.createQuestion(dto)

		if (createdQuizQuestionRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.Forbidden_403,
			}
		}

		return await this.saQuizQuestionsQueryRepository.getQuizQuestionById(
			createdQuizQuestionRes.data,
		)
	}
}
