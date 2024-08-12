import { Injectable } from '@nestjs/common'
import { LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { GameQueryRepository } from '../game.queryRepository'

@Injectable()
export class GetMyStatisticUseCase {
	constructor(private gameQueryRepository: GameQueryRepository) {}

	async execute(userId: string): Promise<LayerResult<null>> {
		// Поле avgScore округляем до 2-х знаков после запятой (например 2.43, 5.55, но не 2.00, а 2).
		/*const gerCurrentUserGameRes =
			await this.gameQueryRepository.getUnfinishedGameByUserId(userId)*/
		/*if (
			gerCurrentUserGameRes.code !== LayerSuccessCode.Success ||
			!gerCurrentUserGameRes.data
		) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}*/
		// @ts-ignore
		// return gerCurrentUserGameRes

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}
}
