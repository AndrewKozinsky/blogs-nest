import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Question } from '../../db/pg/entities/game/question'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import {
	CreateQuizQuestionDtoModel,
	UpdateQuizQuestionDtoModel,
} from './models/quizQuestions.input.model'
import { QuizQuestionOutModel } from './models/quizQuestions.output.model'
import { QuizQuestionServiceModel } from './models/quizQuestions.service.model'

@Injectable()
export class SaQuestionsRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getQuizQuestionById(quizQuestionId: string): Promise<LayerResult<Question>> {
		const quizQuestion = await this.dataSource
			.getRepository(Question)
			.findOneBy({ id: quizQuestionId })

		if (!quizQuestion) {
			return {
				code: LayerErrorCode.NotFound,
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
			data: quizQuestions.map(this.mapDbGameQuestionToServiceGameQuestion),
		}
	}

	async createQuizQuestion(dto: CreateQuizQuestionDtoModel): Promise<LayerResult<string>> {
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

	async deleteGameQuestion(gameQuestionId: string): Promise<LayerResult<boolean>> {
		const queryRes = await this.dataSource
			.getRepository(Question)
			.delete({ id: gameQuestionId })

		if (queryRes.affected !== 1) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	async updateGameQuestion(
		quizQuestionId: string,
		dto: UpdateQuizQuestionDtoModel,
	): Promise<LayerResult<boolean>> {
		const queryRes = await this.dataSource.getRepository(Question).update(quizQuestionId, dto)

		if (queryRes.affected !== 1) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	async publishGameQuestion(quizQuestionId: string): Promise<LayerResult<boolean>> {
		const getQuestionQueryRes = await this.getQuizQuestionById(quizQuestionId)

		if (getQuestionQueryRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		const question = getQuestionQueryRes.data!

		const queryRes = await this.dataSource
			.getRepository(Question)
			.update(quizQuestionId, { published: !question.published })

		if (queryRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: true,
		}
	}

	mapDbGameQuestionToServiceGameQuestion(DbQuizQuestion: Question): QuizQuestionOutModel {
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
