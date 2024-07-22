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
import { LayerResultCode } from '../../types/resultCodes'
import {
	CreateQuizQuestionDtoModel,
	GetQuizQuestionsQueries,
	GetQuizQuestionsQueriesPipe,
	UpdateQuizQuestionDtoModel,
} from './models/quizQuestions.input.model'
import { CreateQuizQuestionUseCase } from './use-cases/createQuizQuestion.useCase'
import { DeleteQuizQuestionUseCase } from './use-cases/deleteQuizQuestion.useCase'
import { GetQuizQuestionUseCase } from './use-cases/getQuizQuestion.useCase'
import { GetQuizQuestionsUseCase } from './use-cases/getQuizQuestions.useCase'
import { PublishQuizQuestionUseCase } from './use-cases/publishQuizQuestion.useCase'
import { UpdateQuizQuestionUseCase } from './use-cases/updateQuizQuestion.useCase'

@Controller(RouteNames.SA_QUIZ_QUESTIONS.value)
export class SaQuizQuestionsController {
	constructor(
		private createQuizQuestionUseCase: CreateQuizQuestionUseCase,
		private deleteQuizQuestionUseCase: DeleteQuizQuestionUseCase,
		private updateQuizQuestionUseCase: UpdateQuizQuestionUseCase,
		private publishQuizQuestionUseCaseUseCase: PublishQuizQuestionUseCase,
		private getQuizQuestionsUseCase: GetQuizQuestionsUseCase,
		private getQuizQuestionUseCase: GetQuizQuestionUseCase,
	) {}

	// Returns a question
	@UseGuards(CheckAdminAuthGuard)
	@Get(':questionId')
	@HttpCode(HttpStatus.OK)
	async getQuizQuestion(@Param('questionId') questionId: string) {
		const getQuizQuestionStatus = await this.getQuizQuestionUseCase.execute(questionId)

		if (getQuizQuestionStatus.code === LayerResultCode.NotFound) {
			throw new NotFoundException()
		}

		if (getQuizQuestionStatus.code !== LayerResultCode.Success) {
			throw new BadRequestException()
		}

		return getQuizQuestionStatus.data
	}

	// Returns all questions with pagination and filtering
	@UseGuards(CheckAdminAuthGuard)
	@Get()
	@HttpCode(HttpStatus.OK)
	async getQuizQuestions(
		@Query(new GetQuizQuestionsQueriesPipe()) query: GetQuizQuestionsQueries,
	) {
		const getQuizQuestionsStatus = await this.getQuizQuestionsUseCase.execute(query)

		if (getQuizQuestionsStatus.code !== LayerResultCode.Success) {
			throw new BadRequestException()
		}

		return getQuizQuestionsStatus.data
	}

	// Create a question
	@UseGuards(CheckAdminAuthGuard)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createQuizQuestion(@Body() body: CreateQuizQuestionDtoModel) {
		const createdQuizQuestionStatus = await this.createQuizQuestionUseCase.execute(body)

		if (createdQuizQuestionStatus.code !== LayerResultCode.Success) {
			throw new BadRequestException()
		}

		return createdQuizQuestionStatus.data
	}

	// Delete a quiz question
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':questionId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteQuizQuestion(@Param('questionId') questionId: string) {
		const deleteQuizQuestionStatus = await this.deleteQuizQuestionUseCase.execute(questionId)

		if (deleteQuizQuestionStatus.code === LayerResultCode.NotFound) {
			throw new NotFoundException()
		}

		if (deleteQuizQuestionStatus.code !== LayerResultCode.Success) {
			throw new BadRequestException()
		}
	}

	// Update a question
	@UseGuards(CheckAdminAuthGuard)
	@Put(':questionId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updateQuizQuestion(
		@Param('questionId') questionId: string,
		@Body() body: UpdateQuizQuestionDtoModel,
	) {
		const updateQuizQuestionStatus = await this.updateQuizQuestionUseCase.execute(
			questionId,
			body,
		)

		if (updateQuizQuestionStatus.code === LayerResultCode.NotFound) {
			throw new NotFoundException()
		}

		if (updateQuizQuestionStatus.code !== LayerResultCode.Success) {
			throw new BadRequestException()
		}
	}

	// Publish/unpublish a question
	@UseGuards(CheckAdminAuthGuard)
	@Put(':questionId/publish')
	@HttpCode(HttpStatus.NO_CONTENT)
	async publishQuizQuestion(@Param('questionId') questionId: string) {
		const publishQuizQuestionStatus =
			await this.publishQuizQuestionUseCaseUseCase.execute(questionId)

		if (publishQuizQuestionStatus.code === LayerResultCode.NotFound) {
			throw new NotFoundException()
		}

		if (publishQuizQuestionStatus.code !== LayerResultCode.Success) {
			throw new BadRequestException()
		}
	}
}
