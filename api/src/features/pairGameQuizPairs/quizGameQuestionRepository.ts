import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { Column, DataSource, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { QuizGame } from '../../db/pg/entities/quizGame'
import { QuizGameQuestion } from '../../db/pg/entities/quizGameQuestion'
import { QuizPlayer } from '../../db/pg/entities/quizPlayer'
import { LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { QuizGameOutModel } from './models/quizGame.output.model'

@Injectable()
export class QuizGameQuestionRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async createGameQuestion(
		gameId: string,
		questionId: string,
		index: number,
	): Promise<LayerResult<string>> {
		const createdGameQuestionRes = await this.dataSource
			.getRepository(QuizGameQuestion)
			.insert({ gameId, questionId, index })

		return {
			code: LayerSuccessCode.Success,
			data: createdGameQuestionRes.identifiers[0].id.toString(),
		}
	}
}
