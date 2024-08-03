import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GameAnswer } from '../../db/pg/entities/game/gameAnswer'
import { Game } from '../../db/pg/entities/game/game'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { SaQuestionsRepository } from '../saQuestions/saQuestionsRepository'
import { PairGameController } from './pairGame.controller'
import { GameQuestionRepository } from './gameQuestion.repository'
import { GameRepository } from './game.repository'
import { GamePlayerRepository } from './gamePlayer.repository'
import { AnswerGameQuestionUseCase } from './use-cases/answerGameQuestion.useCase'
import { ConnectToGameUseCase } from './use-cases/connectToGame.useCase'
import { Question } from '../../db/pg/entities/game/question'

const useCases = [ConnectToGameUseCase, AnswerGameQuestionUseCase]

@Module({
	imports: [TypeOrmModule.forFeature([Question, GamePlayer, Game, GameQuestion, GameAnswer])],
	controllers: [PairGameController],
	providers: [
		GamePlayerRepository,
		GameRepository,
		GameQuestionRepository,
		SaQuestionsRepository,
		...useCases,
	],
})
export class PairGameModule {}
