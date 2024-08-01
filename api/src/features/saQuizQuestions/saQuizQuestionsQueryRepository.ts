import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, ILike } from 'typeorm'
import { QuizQuestion } from '../../db/pg/entities/quizQuestion'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GetQuizQuestionsQueries } from './models/quizQuestions.input.model'
import { GetQuizQuestionsOutModel, QuizQuestionOutModel } from './models/quizQuestions.output.model'

@Injectable()
export class SaQuizQuestionsQueryRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getQuizQuestionById(quizQuestionId: string): Promise<LayerResult<QuizQuestionOutModel>> {
		const quizQuestion = await this.dataSource
			.getRepository(QuizQuestion)
			.findOneBy({ id: quizQuestionId })

		if (!quizQuestion) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbQuizQuestionToQuizQuestion(quizQuestion),
		}
	}

	async getQuizQuestions(
		query: GetQuizQuestionsQueries,
	): Promise<LayerResult<GetQuizQuestionsOutModel>> {
		const bodySearchTerm = query.bodySearchTerm ?? ''
		const publishedStatus = query.publishedStatus ?? 'all'

		const sortBy = query.sortBy ?? '"createdAt"'
		const sortDirection = query.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const totalQuizQuestionsBaseBuilder = this.dataSource
			.createQueryBuilder(QuizQuestion, 'qq')
			.where({ body: ILike(`%${bodySearchTerm}%`) })

		if (publishedStatus !== 'all') {
			const published = publishedStatus === 'published'
			totalQuizQuestionsBaseBuilder.orWhere({ published })
		}

		const totalQuizQuestionsCount = await totalQuizQuestionsBaseBuilder.getCount()

		const pagesCount = Math.ceil(totalQuizQuestionsCount / pageSize)

		const quizQuestions = await totalQuizQuestionsBaseBuilder
			.orderBy(sortBy, sortDirection)
			.skip((pageNumber - 1) * pageSize)
			.take(pageSize)
			.getMany()

		return {
			code: LayerSuccessCode.Success,
			data: {
				pagesCount,
				page: pageNumber,
				pageSize,
				totalCount: totalQuizQuestionsCount,
				items: quizQuestions.map(this.mapDbQuizQuestionToQuizQuestion),
			},
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
