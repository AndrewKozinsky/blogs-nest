import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GameRepository } from './game.repository'
import { GamePlayerRepository } from './gamePlayer.repository'

@Injectable()
export class GameQuestionRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		private gamePlayerRepository: GamePlayerRepository,
		private gameRepository: GameRepository,
	) {}

	async createGameQuestion(
		gameId: string,
		questionId: string,
		index: number,
	): Promise<LayerResult<string>> {
		const createdGameQuestionRes = await this.dataSource
			.getRepository(GameQuestion)
			.insert({ gameId, questionId, index })

		return {
			code: LayerSuccessCode.Success,
			data: createdGameQuestionRes.identifiers[0].id.toString(),
		}
	}

	async getPlayerCurrentQuestion(playerId: string) {
		const getPlayerRes = await this.gamePlayerRepository.getPlayerById(playerId)
		if (getPlayerRes.code !== LayerSuccessCode.Success) {
			return getPlayerRes
		}
		const player = getPlayerRes.data

		const getGameRes = await this.gameRepository.getGameByPlayerId(playerId)
		if (getGameRes.code !== LayerSuccessCode.Success) {
			return getGameRes
		}
		const game = getGameRes.data

		const unansweredQuestion = game.gameQuestions[player.answers.length]
		if (!unansweredQuestion) {
			return {
				code: LayerErrorCode.BadRequest,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: unansweredQuestion,
		}
	}
}
