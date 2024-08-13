import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { GameQueryRepository } from '../game.queryRepository'
import { GetMyGamesDtoModel } from '../models/game.input.model'

@Injectable()
export class GetMyGamesUseCase {
	constructor(private gameQueryRepository: GameQueryRepository) {}

	async execute(userId: string, body: GetMyGamesDtoModel): Promise<LayerResult<null>> {
		// Особенности сортировки списка:
		// если по первому критерию (например status) одинаковые значения - сортируем по pairCreatedDate desc;
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
