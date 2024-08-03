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
export class GetCurrentUserGameUseCase {
	constructor(
		private gamePlayerRepository: GamePlayerRepository,
		private gameGameRepository: GameRepository,
		private gameQuestionRepository: GameQuestionRepository,
		private saQuestionsRepository: SaQuestionsRepository,
		private gameAnswerRepository: GameAnswerRepository,
		private gameRepository: GameRepository,
		private gameQueryRepository: GameQueryRepository,
	) {}

	async execute(userId: string): Promise<LayerResult<GameOutModel.Main>> {
		const gerCurrentUserGameRes = await this.gameQueryRepository.getGameByUserId(userId)
		if (gerCurrentUserGameRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return gerCurrentUserGameRes
	}
}
