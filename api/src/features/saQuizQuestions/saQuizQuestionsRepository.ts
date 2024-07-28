import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { QuizQuestion } from '../../db/pg/entities/quizQuestion'
import { User } from '../../db/pg/entities/user'
import { LayerResult, LayerResultCode } from '../../types/resultCodes'
import {
	CreateQuizQuestionDtoModel,
	UpdateQuizQuestionDtoModel,
} from './models/quizQuestions.input.model'
import { QuizQuestionOutModel } from './models/quizQuestions.output.model'
import { QuizQuestionServiceModel } from './models/quizQuestions.service.model'

@Injectable()
export class SaQuizQuestionsRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getQuizQuestionById(quizQuestionId: string): Promise<LayerResult<QuizQuestion>> {
		const quizQuestion = await this.dataSource
			.getRepository(QuizQuestion)
			.findOneBy({ id: quizQuestionId })

		if (!quizQuestion) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: quizQuestion,
		}
	}

	async getRandomQuestions(
		questionsNumber: number,
	): Promise<LayerResult<QuizQuestionServiceModel[]>> {
		const quizQuestions = await this.dataSource
			.createQueryBuilder(QuizQuestion, 'qq')
			.select()
			.orderBy('RANDOM()')
			.take(questionsNumber)
			.getMany()

		return {
			code: LayerResultCode.Success,
			data: quizQuestions.map(this.mapDbQuizQuestionToQuizQuestion),
		}
	}

	async createQuizQuestion(dto: CreateQuizQuestionDtoModel): Promise<LayerResult<string>> {
		const queryRes = await this.dataSource.getRepository(QuizQuestion).insert({
			body: dto.body,
			correctAnswers: dto.correctAnswers,
			published: false,
		})

		return {
			code: LayerResultCode.Success,
			data: queryRes.identifiers[0].id.toString(),
		}
	}

	async deleteQuizQuestion(quizQuestionId: string): Promise<LayerResult<boolean>> {
		const queryRes = await this.dataSource
			.getRepository(QuizQuestion)
			.delete({ id: quizQuestionId })

		if (queryRes.affected !== 1) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: true,
		}
	}

	async updateQuizQuestion(
		quizQuestionId: string,
		dto: UpdateQuizQuestionDtoModel,
	): Promise<LayerResult<boolean>> {
		const queryRes = await this.dataSource
			.getRepository(QuizQuestion)
			.update(quizQuestionId, dto)

		if (queryRes.affected !== 1) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: true,
		}
	}

	async publishQuizQuestion(quizQuestionId: string): Promise<LayerResult<boolean>> {
		const getQuestionQueryRes = await this.getQuizQuestionById(quizQuestionId)

		if (getQuestionQueryRes.code !== LayerResultCode.Success) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		const question = getQuestionQueryRes.data!

		const queryRes = await this.dataSource
			.getRepository(QuizQuestion)
			.update(quizQuestionId, { published: !question.published })

		if (queryRes.affected !== 1) {
			return {
				code: LayerResultCode.BadRequest,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: true,
		}
	}

	mapDbQuizQuestionToQuizQuestion(DbQuizQuestion: QuizQuestion): QuizQuestionOutModel {
		return {
			id: DbQuizQuestion.id.toString(),
			body: DbQuizQuestion.body,
			correctAnswers: DbQuizQuestion.correctAnswers,
			published: DbQuizQuestion.published,
			createdAt: DbQuizQuestion.createdAt.toISOString(),
			updatedAt: DbQuizQuestion.updatedAt.toISOString(),
		}
	}
}
