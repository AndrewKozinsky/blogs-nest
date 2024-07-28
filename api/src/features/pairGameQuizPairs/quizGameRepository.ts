import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { Column, DataSource, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { QuizGame } from '../../db/pg/entities/quizGame'
import { QuizGameQuestion } from '../../db/pg/entities/quizGameQuestion'
import { QuizPlayer } from '../../db/pg/entities/quizPlayer'
import { LayerResult, LayerResultCode } from '../../types/resultCodes'
import { QuizGameOutModel } from './models/quizGame.output.model'

@Injectable()
export class QuizGameRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async createGame(player_1Id: string): Promise<LayerResult<string>> {
		const createdGameRes = await this.dataSource
			.getRepository(QuizGame)
			.insert({ status: 'pending', player_1Id })

		return {
			code: LayerResultCode.Success,
			data: createdGameRes.identifiers[0].toString(),
		}
	}

	async updateGame(gameId: string, dto: Partial<QuizGame>): Promise<LayerResult<null>> {
		const updateGameRes = await this.dataSource.getRepository(QuizGame).update(gameId, dto)

		if (updateGameRes.affected !== 1) {
			return {
				code: LayerResultCode.BadRequest,
			}
		}

		return {
			code: LayerResultCode.Success,
			data: null,
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
