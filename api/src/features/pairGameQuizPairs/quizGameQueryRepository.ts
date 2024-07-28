import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { QuizGame } from '../../db/pg/entities/quizGame'
import { LayerResult, LayerResultCode } from '../../types/resultCodes'
import { QuizGameOutModel } from './models/quizGame.output.model'

@Injectable()
export class QuizGameQueryRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPendingGame(): Promise<LayerResult<QuizGameOutModel>> {
		const pendingGame = await this.dataSource
			.getRepository(QuizGame)
			.findOneBy({ status: 'pending' })

		if (!pendingGame) {
			return {
				code: LayerResultCode.NotFound,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: this.mapDbQuizQuestionToQuizQuestion(pendingGame),
		}
	}

	mapDbQuizQuestionToQuizQuestion(DbQuizGame: QuizGame): QuizGameOutModel {
		return {
			id: DbQuizGame.id.toString(),
			status: DbQuizGame.status,
			player_1Id: DbQuizGame.player_1Id,
			player_2Id: DbQuizGame.player_2Id,
			questions: DbQuizGame.questions,
		}
	}
}
