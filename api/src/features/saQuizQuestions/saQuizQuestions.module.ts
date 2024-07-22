import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QuizQuestion } from '../../db/pg/entities/quizQuestion'
import { SaQuizQuestionsController } from './saQuizQuestions.controller'
import { SaQuizQuestionsQueryRepository } from './saQuizQuestionsQueryRepository'
import { SaQuizQuestionsRepository } from './saQuizQuestionsRepository'
import { CreateQuizQuestionUseCase } from './use-cases/createQuizQuestion.useCase'
import { DeleteQuizQuestionUseCase } from './use-cases/deleteQuizQuestion.useCase'
import { GetQuizQuestionUseCase } from './use-cases/getQuizQuestion.useCase'
import { GetQuizQuestionsUseCase } from './use-cases/getQuizQuestions.useCase'
import { PublishQuizQuestionUseCase } from './use-cases/publishQuizQuestion.useCase'
import { UpdateQuizQuestionUseCase } from './use-cases/updateQuizQuestion.useCase'

const useCases = [
	GetQuizQuestionsUseCase,
	CreateQuizQuestionUseCase,
	UpdateQuizQuestionUseCase,
	PublishQuizQuestionUseCase,
	DeleteQuizQuestionUseCase,
	GetQuizQuestionUseCase,
]

@Module({
	imports: [TypeOrmModule.forFeature([QuizQuestion])],
	controllers: [SaQuizQuestionsController],
	providers: [SaQuizQuestionsQueryRepository, SaQuizQuestionsRepository, ...useCases],
})
export class SaQuizQuestionsModule {}
