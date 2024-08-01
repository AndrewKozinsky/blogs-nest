import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QuizAnswer } from '../../db/pg/entities/quizAnswer'
import { QuizGame } from '../../db/pg/entities/quizGame'
import { QuizGameQuestion } from '../../db/pg/entities/quizGameQuestion'
import { QuizPlayer } from '../../db/pg/entities/quizPlayer'
import { SaQuizQuestionsRepository } from '../saQuizQuestions/saQuizQuestionsRepository'
import { PairGameQuizPairsController } from './pairGameQuizPairs.controller'
import { QuizGameQuestionRepository } from './quizGameQuestionRepository'
import { QuizGameRepository } from './quizGameRepository'
import { QuizPlayerRepository } from './quizPlayerRepository'
import { ConnectToGameUseCase } from './use-cases/getQuizQuestion.useCase'
import { QuizQuestion } from '../../db/pg/entities/quizQuestion'

const useCases = [ConnectToGameUseCase]

@Module({
	imports: [
		TypeOrmModule.forFeature([
			QuizQuestion,
			QuizPlayer,
			QuizGame,
			QuizGameQuestion,
			QuizAnswer,
		]),
	],
	controllers: [PairGameQuizPairsController],
	providers: [
		QuizPlayerRepository,
		QuizGameRepository,
		QuizGameQuestionRepository,
		SaQuizQuestionsRepository,
		...useCases,
	],
})
export class PairGameQuizPairsModule {}
