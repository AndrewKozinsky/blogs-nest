import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	ParseIntPipe,
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
import { GetCurrentUserGameUseCase } from './use-cases/getCurrentUserGame.useCase'
import { GetGameUseCase } from './use-cases/getGame.useCase'

@Controller(RouteNames.PAIR_GAME.value)
export class PairGameController {
	constructor(
		private connectToGameUseCase: ConnectToGameUseCase,
		private answerGameQuestionUseCase: AnswerGameQuestionUseCase,
		private getGameUseCase: GetGameUseCase,
		private getCurrentUserGameUseCase: GetCurrentUserGameUseCase,
	) {}

	// Connect current user to existing random pending pair or create new pair which will be waiting second player
	@UseGuards(CheckAccessTokenGuard)
	@Post(RouteNames.PAIR_GAME.CONNECTION.value)
	@HttpCode(HttpStatus.OK)
	async connectToGame(@Req() req: Request) {
		if (!req.user) return

		const getGameConnectionStatus = await this.connectToGameUseCase.execute(req.user.id)

		if (getGameConnectionStatus.code === LayerErrorCode.Forbidden_403) {
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

		if (answerGameQuestionStatus.code === LayerErrorCode.Unauthorized_401) {
			throw new UnauthorizedException()
		}

		if (answerGameQuestionStatus.code === LayerErrorCode.Forbidden_403) {
			throw new ForbiddenException()
		}

		if (answerGameQuestionStatus.code !== LayerSuccessCode.Success) {
			throw new ForbiddenException()
		}

		return answerGameQuestionStatus.data
	}

	// Returns current unfinished user game
	@UseGuards(CheckAccessTokenGuard)
	@Get(RouteNames.PAIR_GAME.MY_CURRENT.value)
	@HttpCode(HttpStatus.OK)
	async getCurrentUserGame(@Req() req: Request) {
		if (!req.user) return

		const getCurrentUserGameStatus = await this.getCurrentUserGameUseCase.execute(req.user.id)

		if (
			getCurrentUserGameStatus.code === LayerErrorCode.NotFound_404 ||
			getCurrentUserGameStatus.code !== LayerSuccessCode.Success
		) {
			throw new NotFoundException()
		}

		return getCurrentUserGameStatus.data
	}

	// Returns game by id
	@UseGuards(CheckAccessTokenGuard)
	@Get(':gameId')
	@HttpCode(HttpStatus.OK)
	async getGame(@Req() req: Request, @Param('gameId', ParseIntPipe) gameId: string) {
		if (!req.user) return

		const getGameStatus = await this.getGameUseCase.execute(req.user.id, gameId)

		if (getGameStatus.code === LayerErrorCode.Forbidden_403) {
			throw new ForbiddenException()
		}

		if (
			getGameStatus.code === LayerErrorCode.NotFound_404 ||
			getGameStatus.code !== LayerSuccessCode.Success
		) {
			throw new NotFoundException()
		}

		return getGameStatus.data
	}
}
