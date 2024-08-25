import { Injectable } from '@nestjs/common'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { GameQueryRepository } from '../../../repositories/game/game.queryRepository'
import { GetMyGamesQueries } from '../../../models/pairGame/game.input.model'

@Injectable()
export class GetMyGamesUseCase {
	constructor(private gameQueryRepository: GameQueryRepository) {}

	async execute(userId: string, queries: GetMyGamesQueries): Promise<LayerResult<null>> {
		// Особенности сортировки списка:
		// если по первому критерию (например status) одинаковые значения - сортируем по pairCreatedDate desc;
		const getAllUserGamesRes = await this.gameQueryRepository.getUserGames(userId, queries)

		if (getAllUserGamesRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		// @ts-ignore
		return getAllUserGamesRes
	}
}
