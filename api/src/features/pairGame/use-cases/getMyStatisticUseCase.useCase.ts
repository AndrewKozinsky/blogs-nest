import { Injectable } from '@nestjs/common'
import { GameStatus } from '../../../db/pg/entities/game/game'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../../types/resultCodes'
import { truncateFloatNumber } from '../../../utils/numbers'
import { GameRepository } from '../game.repository'
import { Statistic } from '../models/game.output.model'
import { GameServiceModel } from '../models/game.service.model'

@Injectable()
export class GetMyStatisticUseCase {
	constructor(private gameRepository: GameRepository) {}

	async execute(userId: string): Promise<LayerResult<Statistic>> {
		const getUserGamesRes = await this.gameRepository.getUserGames(userId)

		if (getUserGamesRes.code !== LayerSuccessCode.Success || !getUserGamesRes.data) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.createStatistics(userId, getUserGamesRes.data),
		}
	}

	createStatistics(userId: string, userGames: GameServiceModel.Main[]): Statistic {
		// Сумма всех набранных баллов
		let sumScore = 0
		// Средний балл на игру. Округляем до 2-х знаков после запятой (например 2.43, 5.55, но не 2.00, а 2).
		let avgScores = 0
		// Количество игр у этого пользователя
		let gamesCount = 0
		// Количество игр, где пользователь победил
		let winsCount = 0
		// Количество игр, где пользователь проиграл
		let lossesCount = 0
		// Количество игр, где ничья
		let drawsCount = 0

		userGames.forEach((game) => {
			const player = this.getGamePlayer(userId, game)
			const rival = this.getGameRival(userId, game)

			if (game.status === GameStatus.Finished) {
				// Количество игр у этого пользователя
				gamesCount++
			}

			// Сумма всех набранных баллов
			sumScore += player.score

			if (player.score > rival.score) {
				// Количество игр, где пользователь победил
				winsCount++
			} else if (player.score < rival.score) {
				// Количество игр, где пользователь проиграл
				lossesCount++
			} else if (player.score === rival.score) {
				// Количество игр, где ничья
				drawsCount++
			}
		})

		// Средний балл на игру. Округляем до 2-х знаков после запятой (например 2.43, 5.55, но не 2.00, а 2).
		avgScores = truncateFloatNumber(sumScore / gamesCount, 2)

		return {
			sumScore,
			avgScores,
			gamesCount,
			winsCount,
			lossesCount,
			drawsCount,
		}
	}

	getGamePlayer(userId: string, game: GameServiceModel.Main): GameServiceModel.Player {
		return game.firstPlayer.user.id.toString() === userId
			? game.firstPlayer
			: game.secondPlayer!
	}
	getGameRival(userId: string, game: GameServiceModel.Main): GameServiceModel.Player {
		return game.firstPlayer.user.id.toString() === userId
			? game.secondPlayer!
			: game.firstPlayer
	}
}
