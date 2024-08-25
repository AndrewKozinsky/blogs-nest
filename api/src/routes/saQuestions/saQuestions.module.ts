import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Question } from '../../db/pg/entities/game/question'
import { SaQuestionsController } from './saQuestions.controller'
import { SaQuestionsQueryRepository } from '../../repositories/game/saQuestions.queryRepository'
import { SaQuestionsRepository } from '../../repositories/game/saQuestions.repository'
import { CreateQuestionUseCase } from './use-cases/createQuestion.useCase'
import { DeleteQuestionUseCase } from './use-cases/deleteQuestion.useCase'
import { GetQuestionUseCase } from './use-cases/getQuestion.useCase'
import { GetQuestionsUseCase } from './use-cases/getQuestions.useCase'
import { PublishQuestionUseCase } from './use-cases/publishQuestion.useCase'
import { UpdateQuestionUseCase } from './use-cases/updateQuestion.useCase'

const useCases = [
	GetQuestionsUseCase,
	CreateQuestionUseCase,
	UpdateQuestionUseCase,
	PublishQuestionUseCase,
	DeleteQuestionUseCase,
	GetQuestionUseCase,
]

@Module({
	imports: [TypeOrmModule.forFeature([Question])],
	controllers: [SaQuestionsController],
	providers: [SaQuestionsQueryRepository, SaQuestionsRepository, ...useCases],
})
export class SaQuizQuestionsModule {}
