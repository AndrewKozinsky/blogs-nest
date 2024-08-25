import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, ILike } from 'typeorm'
import { Question } from '../../db/pg/entities/game/question'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GetQuestionsQueries } from '../../models/saQuestions/questions.input.model'
import {
	GetQuestionsOutModel,
	QuestionOutModel,
} from '../../models/saQuestions/questions.output.model'

@Injectable()
export class SaQuestionsQueryRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getQuizQuestionById(quizQuestionId: string): Promise<LayerResult<QuestionOutModel>> {
		const quizQuestion = await this.dataSource
			.getRepository(Question)
			.findOneBy({ id: quizQuestionId })

		if (!quizQuestion) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbQuestionToOutQuestion(quizQuestion),
		}
	}

	async getQuizQuestions(query: GetQuestionsQueries): Promise<LayerResult<GetQuestionsOutModel>> {
		const bodySearchTerm = query.bodySearchTerm ?? ''
		const publishedStatus = query.publishedStatus ?? 'all'

		const sortBy = query.sortBy ?? '"createdAt"'
		const sortDirection = query.sortDirection?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

		const pageNumber = query.pageNumber ? +query.pageNumber : 1
		const pageSize = query.pageSize ? +query.pageSize : 10

		const totalQuizQuestionsBaseBuilder = this.dataSource
			.createQueryBuilder(Question, 'qq')
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
				items: quizQuestions.map(this.mapDbQuestionToOutQuestion),
			},
		}
	}

	mapDbQuestionToOutQuestion(dbQuizQuestion: Question): QuestionOutModel {
		return {
			id: dbQuizQuestion.id.toString(),
			body: dbQuizQuestion.body,
			correctAnswers: dbQuizQuestion.correctAnswers,
			published: dbQuizQuestion.published,
			createdAt: dbQuizQuestion.createdAt.toISOString(),
			updatedAt: dbQuizQuestion.updatedAt ? dbQuizQuestion.updatedAt.toISOString() : null,
		}
	}
}
