import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Question } from '../../db/pg/entities/game/question'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import {
	CreateQuestionDtoModel,
	PublishQuestionDtoModel,
	UpdateQuestionDtoModel,
} from './models/quizQuestions.input.model'
import { QuizQuestionOutModel } from './models/quizQuestions.output.model'
import { QuizQuestionServiceModel } from './models/quizQuestions.service.model'

@Injectable()
export class SaQuestionsRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getQuestionById(questionId: string): Promise<LayerResult<Question>> {
		const quizQuestion = await this.dataSource
			.getRepository(Question)
			.findOneBy({ id: questionId })

		if (!quizQuestion) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: quizQuestion,
		}
	}

	async getRandomQuestions(
		questionsNumber: number,
	): Promise<LayerResult<QuizQuestionServiceModel[]>> {
		const quizQuestions = await this.dataSource
			.createQueryBuilder(Question, 'qq')
			.select()
			.orderBy('RANDOM()')
			.take(questionsNumber)
			.getMany()

		return {
			code: LayerSuccessCode.Success,
			data: quizQuestions.map(this.mapDbQuestionToServiceQuestion),
		}
	}

	async createQuestion(dto: CreateQuestionDtoModel): Promise<LayerResult<string>> {
		const queryRes = await this.dataSource.getRepository(Question).insert({
			body: dto.body,
			correctAnswers: dto.correctAnswers,
			published: false,
		})

		return {
			code: LayerSuccessCode.Success,
			data: queryRes.identifiers[0].id.toString(),
		}
	}

	async deleteQuestion(gameQuestionId: string): Promise<LayerResult<boolean>> {
		const queryRes = await this.dataSource
			.getRepository(Question)
			.delete({ id: gameQuestionId })

		if (queryRes.affected !== 1) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	async updateQuestion(
		questionId: string,
		dto: UpdateQuestionDtoModel,
	): Promise<LayerResult<boolean>> {
		const queryRes = await this.dataSource
			.getRepository(Question)
			.update(questionId, { ...dto, updatedAt: new Date() })

		if (queryRes.affected !== 1) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	async setPublishStatusInQuestion(
		quizQuestionId: string,
		dto: PublishQuestionDtoModel,
	): Promise<LayerResult<boolean>> {
		const queryRes = await this.dataSource
			.getRepository(Question)
			.update(quizQuestionId, { published: dto.published, updatedAt: new Date() })

		if (queryRes.affected !== 1) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	mapDbQuestionToServiceQuestion(DbQuizQuestion: Question): QuizQuestionOutModel {
		return {
			id: DbQuizQuestion.id.toString(),
			body: DbQuizQuestion.body,
			correctAnswers: DbQuizQuestion.correctAnswers,
			published: DbQuizQuestion.published,
			createdAt: DbQuizQuestion.createdAt.toISOString(),
			updatedAt: DbQuizQuestion.updatedAt ? DbQuizQuestion.updatedAt.toISOString() : null,
		}
	}
}
