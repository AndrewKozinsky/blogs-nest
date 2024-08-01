import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GameStatus, QuizGame } from '../../db/pg/entities/quizGame'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { QuizGameOutModel } from './models/quizGame.output.model'

@Injectable()
export class QuizGameQueryRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPendingGame(): Promise<LayerResult<QuizGameOutModel>> {
		const pendingGame = await this.dataSource
			.getRepository(QuizGame)
			.findOneBy({ status: GameStatus.Pending })

		if (!pendingGame) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbQuizGameToQuizGame(pendingGame),
		}
	}

	/*async getGame(gameId: string): Promise<LayerResult<QuizGameOutModel>> {
		const getGameRes = await this.dataSource.getRepository(QuizGame).findOneBy({ id: gameId })

		if (!getGameRes) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbQuizQuestionToQuizQuestion(getGameRes),
		}
	}*/

	mapDbQuizGameToQuizGame(DbQuizGame: QuizGame): QuizGameOutModel {
		let secondPlayer = null
		if (DbQuizGame.secondPlayer) {
			secondPlayer = {
				id: DbQuizGame.secondPlayerId,
				login: DbQuizGame.secondPlayer.user.login,
			}
		}

		return {
			id: DbQuizGame.id.toString(),
			status: DbQuizGame.status,
			firstPlayer: {
				id: DbQuizGame.firstPlayerId.toString(),
				login: DbQuizGame.firstPlayer.user.login,
			},
			secondPlayer: secondPlayer,
			questions: DbQuizGame.questions.map((question) => {
				return {
					id: question.questionId,
					body: question.question,
				}
			}),
			pairCreatedDate: DbQuizGame.createdAt.toISOString(),
		}
	}
}
