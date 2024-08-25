import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { CreateQuestionDtoModel } from '../../../models/saQuestions/questions.input.model'
import { QuestionOutModel } from '../../../models/saQuestions/questions.output.model'
import { SaQuestionsQueryRepository } from '../../../repositories/game/saQuestions.queryRepository'
import { SaQuestionsRepository } from '../../../repositories/game/saQuestions.repository'

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
