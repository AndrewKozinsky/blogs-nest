import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { GameQueryRepository } from '../game.queryRepository'
import { GetMyGamesDtoModel } from '../models/game.input.model'

@Injectable()
export class GetMyGamesUseCase {
	constructor(private gameQueryRepository: GameQueryRepository) {}

	async execute(userId: string, body: GetMyGamesDtoModel): Promise<LayerResult<null>> {
		// Поле avgScore округляем до 2-х знаков после запятой (например 2.43, 5.55, но не 2.00, а 2).
		const gerAllUserGamesRes = await this.gameQueryRepository.getUserGames(userId, body)

		if (gerAllUserGamesRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		// @ts-ignore
		return gerAllUserGamesRes
	}
}
