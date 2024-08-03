import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GameStatus, Game } from '../../db/pg/entities/game/game'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GameOutModel } from './models/game.output.model'

@Injectable()
export class GameQueryRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPendingGame(): Promise<LayerResult<GameOutModel>> {
		const pendingGame = await this.dataSource
			.getRepository(Game)
			.findOneBy({ status: GameStatus.Pending })

		if (!pendingGame) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGameToOutGame(pendingGame),
		}
	}

	mapDbGameToOutGame(dbGame: Game): GameOutModel {
		let secondPlayer = null
		if (dbGame.secondPlayer) {
			secondPlayer = {
				id: dbGame.secondPlayerId,
				login: dbGame.secondPlayer.user.login,
			}
		}

		return {
			id: dbGame.id.toString(),
			status: dbGame.status,
			firstPlayer: {
				id: dbGame.firstPlayerId.toString(),
				login: dbGame.firstPlayer.user.login,
			},
			secondPlayer: secondPlayer,
			questions: dbGame.gameQuestions.map((question) => {
				return {
					id: question.questionId,
					body: question.question.body,
				}
			}),
			pairCreatedDate: dbGame.createdAt.toISOString(),
		}
	}
}
