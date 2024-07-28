import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	Put,
	Query,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { RequestService } from '../../base/application/request.service'
import { CheckAccessTokenGuard } from '../../infrastructure/guards/checkAccessToken.guard'
import RouteNames from '../../settings/routeNames'
import { LayerResultCode } from '../../types/resultCodes'
// import {
// 	CreateQuizQuestionDtoModel,
// 	GetQuizQuestionsQueries,
// 	GetQuizQuestionsQueriesPipe,
// 	UpdateQuizQuestionDtoModel,
// } from './models/quizQuestions.input.model'
// import { CreateQuizQuestionUseCase } from './use-cases/createQuizQuestion.useCase'
// import { DeleteQuizQuestionUseCase } from './use-cases/deleteQuizQuestion.useCase'
import { ConnectToGameUseCase } from './use-cases/getQuizQuestion.useCase'
// import { GetQuizQuestionsUseCase } from './use-cases/getQuizQuestions.useCase'
// import { PublishQuizQuestionUseCase } from './use-cases/publishQuizQuestion.useCase'
// import { UpdateQuizQuestionUseCase } from './use-cases/updateQuizQuestion.useCase'

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

		if (getQuizConnectionStatus.code !== LayerResultCode.Success) {
			throw new BadRequestException()
		}

		return getQuizConnectionStatus.data
	}
}
