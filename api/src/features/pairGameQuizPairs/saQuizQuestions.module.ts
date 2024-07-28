import { Module } from '@nestjs/common'
import { SaQuizQuestionsRepository } from '../saQuizQuestions/saQuizQuestionsRepository'
import { PairGameQuizPairsController } from './pairGameQuizPairs.controller'
import { QuizGameQueryRepository } from './quizGameQueryRepository'
import { QuizGameQuestionRepository } from './quizGameQuestionRepository'
import { QuizGameRepository } from './quizGameRepository'
import { QuizPlayerRepository } from './quizPlayerRepository'
import { ConnectToGameUseCase } from './use-cases/getQuizQuestion.useCase'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QuizQuestion } from '../../db/pg/entities/quizQuestion'

const useCases = [ConnectToGameUseCase]

@Module({
	imports: [TypeOrmModule.forFeature([QuizQuestion])],
	controllers: [PairGameQuizPairsController],
	providers: [
		QuizPlayerRepository,
		QuizGameQueryRepository,
		QuizGameRepository,
		QuizGameQuestionRepository,
		SaQuizQuestionsRepository,
		...useCases,
	],
})
export class PairGameQuizPairsModule {}
