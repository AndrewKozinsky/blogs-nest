import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { SaQuestionsRepository } from '../../../repositories/game/saQuestions.repository'
import { GameQueryRepository } from '../../../repositories/game/game.queryRepository'
import { GameOutModel } from '../../../models/pairGame/game.output.model'
import { GameAnswerQueryRepository } from '../../../repositories/game/gameAnswer.queryRepository'
import { GameAnswerRepository } from '../../../repositories/game/gameAnswer.repository'
import { GameQuestionRepository } from '../../../repositories/game/gameQuestion.repository'
import { GameRepository } from '../../../repositories/game/game.repository'
import { GamePlayerRepository } from '../../../repositories/game/gamePlayer.repository'
import { GameServiceModel } from '../../../models/pairGame/game.service.model'

@Injectable()
export class GetCurrentUserGameUseCase {
	constructor(private gameQueryRepository: GameQueryRepository) {}

	async execute(userId: string): Promise<LayerResult<GameOutModel.Main>> {
		const gerCurrentUserGameRes =
			await this.gameQueryRepository.getUnfinishedGameByUserId(userId)

		if (
			gerCurrentUserGameRes.code !== LayerSuccessCode.Success ||
			!gerCurrentUserGameRes.data
		) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		// @ts-ignore
		return gerCurrentUserGameRes
	}
}
