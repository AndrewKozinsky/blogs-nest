import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { SaQuestionsRepository } from '../../saQuestions/saQuestionsRepository'
import { GameQueryRepository } from '../game.queryRepository'
import { GameOutModel } from '../models/game.output.model'
import { GameAnswerQueryRepository } from '../gameAnswer.queryRepository'
import { GameAnswerRepository } from '../gameAnswer.repository'
import { GameQuestionRepository } from '../gameQuestion.repository'
import { GameRepository } from '../game.repository'
import { GamePlayerRepository } from '../gamePlayer.repository'
import { GameServiceModel } from '../models/game.service.model'

@Injectable()
export class GetGameUseCase {
	constructor(private gameQueryRepository: GameQueryRepository) {}

	async execute(userId: string, gameId: string): Promise<LayerResult<GameOutModel.Main>> {
		const gerGameRes = await this.gameQueryRepository.getGameById(gameId)
		if (gerGameRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const game = gerGameRes.data

		// Если пользователь пытается получить данные игры, к которой не принадлежит, то 403
		if (!this.userIsParticipantOfGame(userId, game)) {
			return {
				code: LayerErrorCode.Forbidden_403,
			}
		}

		return gerGameRes
	}

	userIsParticipantOfGame(userId: string, game: GameOutModel.Main): boolean {
		return (
			game.firstPlayerProgress.player.id === userId ||
			(!!game.secondPlayerProgress && game.secondPlayerProgress.player.id === userId)
		)
	}
}
