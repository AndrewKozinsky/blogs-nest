import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GameAnswer } from '../../db/pg/entities/game/gameAnswer'
import { Game } from '../../db/pg/entities/game/game'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { SaQuestionsRepository } from '../../repositories/game/saQuestions.repository'
import { GameQueryRepository } from '../../repositories/game/game.queryRepository'
import { GameAnswerQueryRepository } from '../../repositories/game/gameAnswer.queryRepository'
import { GameAnswerRepository } from '../../repositories/game/gameAnswer.repository'
import { PairGameController } from './pairGame.controller'
import { GameQuestionRepository } from '../../repositories/game/gameQuestion.repository'
import { GameRepository } from '../../repositories/game/game.repository'
import { GamePlayerRepository } from '../../repositories/game/gamePlayer.repository'
import { TasksService } from './task.service'
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
		TasksService,
		...useCases,
	],
})
export class PairGameModule {}
