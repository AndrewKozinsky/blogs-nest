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
	Res,
	UseGuards,
} from '@nestjs/common'
import { CheckAdminAuthGuard } from '../../infrastructure/guards/checkAdminAuth.guard'
import RouteNames from '../../settings/routeNames'
import { LayerErrorCode, LayerSuccessCode } from '../../types/resultCodes'
import {
	CreateQuestionDtoModel,
	GetQuestionsQueries,
	GetQuestionsQueriesPipe,
	PublishQuestionDtoModel,
	UpdateQuestionDtoModel,
} from './models/quizQuestions.input.model'
import { CreateQuestionUseCase } from './use-cases/createQuestion.useCase'
import { DeleteQuestionUseCase } from './use-cases/deleteQuestion.useCase'
import { GetQuestionUseCase } from './use-cases/getQuestion.useCase'
import { GetQuestionsUseCase } from './use-cases/getQuestions.useCase'
import { PublishQuestionUseCase } from './use-cases/publishQuestion.useCase'
import { UpdateQuestionUseCase } from './use-cases/updateQuestion.useCase'

@Controller(RouteNames.SA_QUESTIONS.value)
export class SaQuestionsController {
	constructor(
		private createQuestionUseCase: CreateQuestionUseCase,
		private deleteQuestionUseCase: DeleteQuestionUseCase,
		private updateQuestionUseCase: UpdateQuestionUseCase,
		private publishQuestionUseCaseUseCase: PublishQuestionUseCase,
		private getQuizQuestionsUseCase: GetQuestionsUseCase,
		private getQuizQuestionUseCase: GetQuestionUseCase,
	) {}

	// Returns all questions with pagination and filtering
	@UseGuards(CheckAdminAuthGuard)
	@Get()
	@HttpCode(HttpStatus.OK)
	async getQuizQuestions(@Query(new GetQuestionsQueriesPipe()) query: GetQuestionsQueries) {
		const getQuizQuestionsStatus = await this.getQuizQuestionsUseCase.execute(query)

		if (getQuizQuestionsStatus.code !== LayerSuccessCode.Success) {
			throw new BadRequestException()
		}

		return getQuizQuestionsStatus.data
	}

	// Returns a question
	@UseGuards(CheckAdminAuthGuard)
	@Get(':questionId')
	@HttpCode(HttpStatus.OK)
	async getQuizQuestion(@Param('questionId') questionId: string) {
		const getQuizQuestionStatus = await this.getQuizQuestionUseCase.execute(questionId)

		if (getQuizQuestionStatus.code === LayerErrorCode.NotFound_404) {
			throw new NotFoundException()
		}

		if (getQuizQuestionStatus.code !== LayerSuccessCode.Success) {
			throw new BadRequestException()
		}

		return getQuizQuestionStatus.data
	}

	// Create a question
	@UseGuards(CheckAdminAuthGuard)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createQuizQuestion(@Body() body: CreateQuestionDtoModel) {
		const createdQuizQuestionStatus = await this.createQuestionUseCase.execute(body)

		if (createdQuizQuestionStatus.code !== LayerSuccessCode.Success) {
			throw new BadRequestException()
		}

		return createdQuizQuestionStatus.data
	}

	// Delete a quiz question
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':questionId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteQuizQuestion(@Param('questionId') questionId: string) {
		const deleteQuizQuestionStatus = await this.deleteQuestionUseCase.execute(questionId)

		if (deleteQuizQuestionStatus.code === LayerErrorCode.NotFound_404) {
			throw new NotFoundException()
		}

		if (deleteQuizQuestionStatus.code !== LayerSuccessCode.Success) {
			throw new BadRequestException()
		}
	}

	// Update a question
	@UseGuards(CheckAdminAuthGuard)
	@Put(':questionId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updateQuizQuestion(
		@Param('questionId') questionId: string,
		@Body() body: UpdateQuestionDtoModel,
	) {
		const updateQuizQuestionStatus = await this.updateQuestionUseCase.execute(questionId, body)

		if (updateQuizQuestionStatus.code === LayerErrorCode.NotFound_404) {
			throw new NotFoundException()
		}

		if (updateQuizQuestionStatus.code !== LayerSuccessCode.Success) {
			throw new BadRequestException()
		}
	}

	// Publish/unpublish a question
	@UseGuards(CheckAdminAuthGuard)
	@Put(':questionId/' + RouteNames.SA_QUESTIONS.QUESTION_ID('').PUBLISH.value)
	@HttpCode(HttpStatus.NO_CONTENT)
	async publishQuizQuestion(
		@Param('questionId') questionId: string,
		@Body() body: PublishQuestionDtoModel,
	) {
		const publishQuizQuestionStatus = await this.publishQuestionUseCaseUseCase.execute(
			questionId,
			body,
		)

		if (publishQuizQuestionStatus.code === LayerErrorCode.NotFound_404) {
			throw new NotFoundException()
		}

		if (publishQuizQuestionStatus.code !== LayerSuccessCode.Success) {
			throw new BadRequestException()
		}
	}
}
