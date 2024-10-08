import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GameAnswer } from '../../db/pg/entities/game/gameAnswer'
import { LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GameAnswerOutModel } from '../../models/pairGame/game.output.model'

@Injectable()
export class GameAnswerQueryRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getAnswer(answerId: string): Promise<LayerResult<null | GameAnswerOutModel>> {
		const getPlayerRes = await this.dataSource
			.getRepository(GameAnswer)
			.findOneBy({ id: answerId })

		if (!getPlayerRes) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGameAnswerToOutGameAnswer(getPlayerRes),
		}
	}

	mapDbGameAnswerToOutGameAnswer(dbGameAnswer: GameAnswer): GameAnswerOutModel {
		return {
			questionId: dbGameAnswer.questionId.toString(),
			answerStatus: dbGameAnswer.status,
			addedAt: dbGameAnswer.createdAt.toISOString(),
		}
	}
}
