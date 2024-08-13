import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { CreateQuestionDtoModel } from '../models/questions.input.model'
import { QuestionOutModel } from '../models/questions.output.model'
import { SaQuestionsQueryRepository } from '../saQuestionsQueryRepository'
import { SaQuestionsRepository } from '../saQuestionsRepository'

@Injectable()
export class CreateQuestionUseCase {
	constructor(
		private saQuizQuestionsRepository: SaQuestionsRepository,
		private saQuizQuestionsQueryRepository: SaQuestionsQueryRepository,
	) {}

	async execute(dto: CreateQuestionDtoModel): Promise<LayerResult<QuestionOutModel>> {
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
