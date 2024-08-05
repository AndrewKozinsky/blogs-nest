import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GameRepository } from './game.repository'
import { GamePlayerRepository } from './gamePlayer.repository'
import { GamePlayerServiceModel, GameQuestionServiceModel } from './models/game.service.model'

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

	async getPlayerCurrentGameQuestion(playerId: string) {
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

		const unansweredGameQuestion = game.gameQuestions[player.answers.length]
		if (!unansweredGameQuestion) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		const getGameQuestionRes = await this.dataSource.getRepository(GameQuestion).findOne({
			where: { id: unansweredGameQuestion.id },
			relations: {
				question: true,
			},
		})
		if (!getGameQuestionRes) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGameQuestionToServiceGameQuestion(getGameQuestionRes),
		}
	}

	mapDbGameQuestionToServiceGameQuestion(dbGameQuestion: GameQuestion): GameQuestionServiceModel {
		return {
			id: dbGameQuestion.id,
			gameId: dbGameQuestion.gameId,
			index: dbGameQuestion.index,
			question: {
				questionId: dbGameQuestion.question.id,
				correctAnswers: dbGameQuestion.question.correctAnswers,
			},
		}
	}
}
