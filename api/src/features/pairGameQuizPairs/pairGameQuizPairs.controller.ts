import {
	BadRequestException,
	Controller,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	Req,
	UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { CheckAccessTokenGuard } from '../../infrastructure/guards/checkAccessToken.guard'
import RouteNames from '../../settings/routeNames'
import { LayerErrorCode, LayerSuccessCode } from '../../types/resultCodes'
import { ConnectToGameUseCase } from './use-cases/getQuizQuestion.useCase'

@Controller(RouteNames.PAIR_GAME_QUIZ_PAIRS.value)
export class PairGameQuizPairsController {
	constructor(private connectToGameUseCase: ConnectToGameUseCase) {}

	// Connect current user to existing random pending pair or create new pair which will be waiting second player
	@UseGuards(CheckAccessTokenGuard)
	@Get(':questionId')
	@HttpCode(HttpStatus.OK)
	async getQuizQuestion(@Req() req: Request) {
		if (!req.user) return

		const getQuizConnectionStatus = await this.connectToGameUseCase.execute(req.user.id)

		if (getQuizConnectionStatus.code === LayerErrorCode.Forbidden) {
			throw new ForbiddenException()
		}

		if (getQuizConnectionStatus.code !== LayerSuccessCode.Success) {
			throw new BadRequestException()
		}

		return getQuizConnectionStatus.data
	}
}
