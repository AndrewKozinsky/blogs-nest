import { Injectable } from '@nestjs/common'
import { GameStatus } from '../../../db/pg/entities/game/game'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { truncateFloatNumber } from '../../../utils/numbers'
import { GameRepository } from '../../../repositories/game/game.repository'
import { GamePlayerRepository } from '../../../repositories/game/gamePlayer.repository'
import { GetTopStatisticQueries } from '../../../models/pairGame/game.input.model'
import { TopStatisticsOutModel } from '../../../models/pairGame/game.output.model'
import { GameServiceModel } from '../../../models/pairGame/game.service.model'

@Injectable()
export class GetTopStatisticUseCase {
	constructor(private gamePlayerRepository: GamePlayerRepository) {}

	async execute(query: GetTopStatisticQueries): Promise<LayerResult<TopStatisticsOutModel>> {
		const getTopStatisticsRes = await this.gamePlayerRepository.getTopStatistics(query)

		if (getTopStatisticsRes.code !== LayerSuccessCode.Success) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getTopStatisticsRes.data,
		}
	}
}
