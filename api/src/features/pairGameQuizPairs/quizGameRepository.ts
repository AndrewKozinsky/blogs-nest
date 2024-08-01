import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GameStatus, QuizGame } from '../../db/pg/entities/quizGame'
import { QuizPlayer } from '../../db/pg/entities/quizPlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { QuizGameOutModel } from './models/quizGame.output.model'
import { QuizGameServiceModel } from './models/quizGame.service.model'

@Injectable()
export class QuizGameRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPendingGame(): Promise<LayerResult<QuizGameOutModel>> {
		const getPendingGame = await this.dataSource.getRepository(QuizGame).findOne({
			where: { status: GameStatus.Pending },
			relations: {
				firstPlayer: {
					user: true,
				},
				secondPlayer: {
					user: true,
				},
				questions: true,
			},
		})

		if (!getPendingGame) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbQuizGameToQuizGame(getPendingGame),
		}
	}

	async getGame(gameId: string): Promise<LayerResult<QuizGameServiceModel>> {
		const getGameRes = await this.dataSource.getRepository(QuizGame).findOne({
			where: { id: gameId },
			relations: {
				firstPlayer: {
					user: true,
				},
				secondPlayer: {
					user: true,
				},
				questions: true,
			},
		})

		if (!getGameRes) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbQuizGameToQuizGame(getGameRes),
		}
	}

	async createGame(firstPlayerId: string): Promise<LayerResult<string>> {
		const createdGameRes = await this.dataSource.getRepository(QuizGame).insert({
			status: GameStatus.Pending,
			firstPlayerId,
		})

		return {
			code: LayerSuccessCode.Success,
			data: createdGameRes.identifiers[0].id.toString(),
		}
	}

	async updateGame(gameId: string, dto: Partial<QuizGame>): Promise<LayerResult<null>> {
		const updateGameRes = await this.dataSource.getRepository(QuizGame).update(gameId, dto)

		if (updateGameRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	mapDbQuizGameToQuizGame(DbQuizGame: QuizGame): QuizGameServiceModel {
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
			secondPlayer,
			questions: DbQuizGame.questions.map((question) => {
				return {
					id: question.questionId.toString(),
					body: question.question,
				}
			}),
			pairCreatedDate: DbQuizGame.createdAt.toISOString(),
		} as any
	}
}
