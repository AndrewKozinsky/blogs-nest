import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Question } from '../../db/pg/entities/game/question'
import { SaQuestionsController } from './saQuestions.controller'
import { SaQuestionsQueryRepository } from './saQuestionsQueryRepository'
import { SaQuestionsRepository } from './saQuestionsRepository'
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
	imports: [TypeOrmModule.forFeature([Question])],
	controllers: [SaQuestionsController],
	providers: [SaQuestionsQueryRepository, SaQuestionsRepository, ...useCases],
})
export class SaQuizQuestionsModule {}
