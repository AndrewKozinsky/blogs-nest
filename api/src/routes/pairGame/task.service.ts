import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { GameRepository } from '../../repositories/game/game.repository'

@Injectable()
export class TasksService {
	constructor(private gameRepository: GameRepository) {}

	@Cron(CronExpression.EVERY_30_SECONDS)
	handleCron() {
		this.gameRepository.finishGamesWhereTimeRunOut()
	}
}
