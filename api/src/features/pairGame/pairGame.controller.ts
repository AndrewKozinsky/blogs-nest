import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { CheckAccessTokenGuard } from '../../infrastructure/guards/checkAccessToken.guard'
import RouteNames from '../../settings/routeNames'
import { LayerErrorCode, LayerSuccessCode } from '../../types/resultCodes'
import { AnswerGameQuestionDtoModel } from './models/game.input.model'
import { AnswerGameQuestionUseCase } from './use-cases/answerGameQuestion.useCase'
import { ConnectToGameUseCase } from './use-cases/connectToGame.useCase'

@Controller(RouteNames.PAIR_GAME.value)
export class PairGameController {
	constructor(
		private connectToGameUseCase: ConnectToGameUseCase,
		private answerGameQuestionUseCase: AnswerGameQuestionUseCase,
	) {}

	// Connect current user to existing random pending pair or create new pair which will be waiting second player
	@UseGuards(CheckAccessTokenGuard)
	@Get(RouteNames.PAIR_GAME.CONNECTION.value)
	@HttpCode(HttpStatus.OK)
	async connectToGame(@Req() req: Request) {
		if (!req.user) return

		const getGameConnectionStatus = await this.connectToGameUseCase.execute(req.user.id)

		if (getGameConnectionStatus.code === LayerErrorCode.Forbidden) {
			throw new ForbiddenException()
		}

		if (getGameConnectionStatus.code !== LayerSuccessCode.Success) {
			throw new BadRequestException()
		}

		return getGameConnectionStatus.data
	}

	// Send an answer for the next not answered question in an active pair
	@UseGuards(CheckAccessTokenGuard)
	@Post(
		RouteNames.PAIR_GAME.MY_CURRENT.value + '/' + RouteNames.PAIR_GAME.MY_CURRENT.ANSWERS.value,
	)
	@HttpCode(HttpStatus.OK)
	async answerGameQuestion(@Req() req: Request, @Body() body: AnswerGameQuestionDtoModel) {
		if (!req.user) return

		const answerGameQuestionStatus = await this.answerGameQuestionUseCase.execute(
			req.user.id,
			body,
		)

		if (answerGameQuestionStatus.code === LayerErrorCode.Unauthorized) {
			throw new UnauthorizedException()
		}

		if (answerGameQuestionStatus.code !== LayerSuccessCode.Success) {
			throw new BadRequestException()
		}

		return answerGameQuestionStatus.data
	}
}
