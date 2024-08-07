import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { GameQueryRepository } from '../game.queryRepository'
import { GameOutModel } from '../models/game.output.model'

@Injectable()
export class GetGameUseCase {
	constructor(private gameQueryRepository: GameQueryRepository) {}

	async execute(userId: string, gameId: string): Promise<LayerResult<GameOutModel.Main>> {
		const getGameRes = await this.gameQueryRepository.getGameById(gameId)
		if (getGameRes.code !== LayerSuccessCode.Success || !getGameRes.data) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const game = getGameRes.data

		// Если пользователь пытается получить данные игры, к которой не принадлежит, то 403
		if (!this.userIsParticipantOfGame(userId, game)) {
			return {
				code: LayerErrorCode.Forbidden_403,
			}
		}

		// @ts-ignore
		return getGameRes
	}

	userIsParticipantOfGame(userId: string, game: GameOutModel.Main): boolean {
		return (
			game.firstPlayerProgress.player.id === userId ||
			(!!game.secondPlayerProgress && game.secondPlayerProgress.player.id === userId)
		)
	}
}
