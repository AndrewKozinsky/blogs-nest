import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GameAnswerStatus, GameAnswer } from '../../db/pg/entities/game/gameAnswer'
import { LayerResult, LayerSuccessCode } from '../../types/resultCodes'

@Injectable()
export class GameAnswerRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async createGameAnswer(
		playerId: string,
		questionId: string,
		status: GameAnswerStatus,
	): Promise<LayerResult<string>> {
		const createdGameQuestionRes = await this.dataSource
			.getRepository(GameAnswer)
			.insert({ playerId, questionId, status })

		return {
			code: LayerSuccessCode.Success,
			data: createdGameQuestionRes.identifiers[0].id.toString(),
		}
	}
}
