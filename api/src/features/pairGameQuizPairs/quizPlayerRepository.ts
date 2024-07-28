import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { QuizPlayer } from '../../db/pg/entities/quizPlayer'
import { LayerResult, LayerResultCode } from '../../types/resultCodes'

@Injectable()
export class QuizPlayerRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async createPlayer(userId: string): Promise<LayerResult<string>> {
		const queryRes = await this.dataSource.getRepository(QuizPlayer).insert({
			userId,
			score: 0,
			answers: [],
		})

		return {
			code: LayerResultCode.Success,
			data: queryRes.identifiers[0].id.toString(),
		}
	}
}
