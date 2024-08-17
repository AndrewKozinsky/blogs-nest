import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GameAnswer } from '../../db/pg/entities/game/gameAnswer'
import { Game } from '../../db/pg/entities/game/game'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { SaQuestionsRepository } from '../saQuestions/saQuestionsRepository'
import { GameQueryRepository } from './game.queryRepository'
import { GameAnswerQueryRepository } from './gameAnswer.queryRepository'
import { GameAnswerRepository } from './gameAnswer.repository'
import { PairGameController } from './pairGame.controller'
import { GameQuestionRepository } from './gameQuestion.repository'
import { GameRepository } from './game.repository'
import { GamePlayerRepository } from './gamePlayer.repository'
import { AnswerGameQuestionUseCase } from './use-cases/answerGameQuestion.useCase'
import { ConnectToGameUseCase } from './use-cases/connectToGame.useCase'
import { Question } from '../../db/pg/entities/game/question'
import { GetCurrentUserGameUseCase } from './use-cases/getCurrentUserGame.useCase'
import { GetGameUseCase } from './use-cases/getGame.useCase'
import { GetMyGamesUseCase } from './use-cases/getMyGames.useCase'
import { GetMyStatisticUseCase } from './use-cases/getMyStatisticUseCase.useCase'
import { GetTopStatisticUseCase } from './use-cases/getTopStatisticUseCase.useCase'

const useCases = [
	ConnectToGameUseCase,
	AnswerGameQuestionUseCase,
	GetGameUseCase,
	GetCurrentUserGameUseCase,
	GetMyStatisticUseCase,
	GetMyGamesUseCase,
	GetTopStatisticUseCase,
]

@Module({
	imports: [TypeOrmModule.forFeature([Question, GamePlayer, Game, GameQuestion, GameAnswer])],
	controllers: [PairGameController],
	providers: [
		GamePlayerRepository,
		GameRepository,
		GameQuestionRepository,
		SaQuestionsRepository,
		GameQueryRepository,
		GameAnswerRepository,
		GameAnswerQueryRepository,
		...useCases,
	],
})
export class PairGameModule {}
