import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOneOptions, FindOptionsWhere, Not } from 'typeorm'
import { Game, GameStatus } from '../../db/pg/entities/game/game'
import { GameAnswer } from '../../db/pg/entities/game/gameAnswer'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { gameConfig } from './config'
import { GamePlayerRepository } from './gamePlayer.repository'
import { GameServiceModel } from './models/game.service.model'

@Injectable()
export class GameRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPendingGames(): Promise<LayerResult<null | GameServiceModel.Main[]>> {
		return this.getGamesWhere({ status: GameStatus.Pending })
	}

	async getUnfinishedGames(): Promise<LayerResult<null | GameServiceModel.Main[]>> {
		return this.getGamesWhere({ status: Not(GameStatus.Finished) })
	}

	async getPendingGame(): Promise<LayerResult<null | GameServiceModel.Main>> {
		const getGamesRes = await this.getGamesWhere({ status: GameStatus.Pending })

		if (getGamesRes.code !== LayerSuccessCode.Success || !getGamesRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGamesRes.data[0],
		}
	}

	async getGameById(gameId: string): Promise<LayerResult<null | GameServiceModel.Main>> {
		const getGamesRes = await this.getGamesWhere({ id: gameId })

		if (getGamesRes.code !== LayerSuccessCode.Success || !getGamesRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGamesRes.data[0],
		}
	}

	async getGameByPlayerId(playerId: string): Promise<LayerResult<null | GameServiceModel.Main>> {
		const getGamesRes = await this.getGamesWhere([
			{ firstPlayerId: playerId },
			{ secondPlayerId: playerId },
		])

		if (getGamesRes.code !== LayerSuccessCode.Success || !getGamesRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGamesRes.data[0],
		}
	}

	async getUnfinishedGameByUserId(
		userId: string,
	): Promise<LayerResult<null | GameServiceModel.Main>> {
		const getGamesRes = await this.getGamesWhere([
			{
				firstPlayer: {
					user: {
						id: userId,
					},
				},
				status: Not(GameStatus.Finished),
			},
			{
				secondPlayer: {
					user: {
						id: userId,
					},
				},
				status: Not(GameStatus.Finished),
			},
		])

		if (getGamesRes.code !== LayerSuccessCode.Success || !getGamesRes.data.length) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGamesRes.data[0],
		}
	}

	private async getGamesWhere(
		whereCondition: FindOptionsWhere<Game> | FindOptionsWhere<Game>[] | undefined,
	): Promise<LayerResult<GameServiceModel.Main[]>> {
		const getGameRes = await this.dataSource.getRepository(Game).find({
			where: whereCondition,
			relations: {
				firstPlayer: {
					user: true,
					answers: true,
				},
				secondPlayer: {
					user: true,
					answers: true,
				},
				gameQuestions: {
					question: true,
				},
			},
			order: { gameQuestions: { index: 'ASC' } },
		})

		for (const game of getGameRes) {
			game.firstPlayer.answers = sortAnswers(game.firstPlayer.answers)
			if (game.secondPlayer) {
				game.secondPlayer.answers = sortAnswers(game.secondPlayer.answers)
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGameRes.map(this.mapDbGameToServiceGame),
		}

		function sortAnswers(answers: GameAnswer[]) {
			return answers.sort((a, b) => {
				return a.createdAt < b.createdAt ? -1 : 1
			})
		}
	}

	async createGame(firstPlayerId: string): Promise<LayerResult<string>> {
		const createdGameRes = await this.dataSource.getRepository(Game).insert({
			status: GameStatus.Pending,
			firstPlayerId,
		})

		return {
			code: LayerSuccessCode.Success,
			data: createdGameRes.identifiers[0].id.toString(),
		}
	}

	async updateGame(gameId: string, dto: Partial<Game>): Promise<LayerResult<null>> {
		const updateGameRes = await this.dataSource.getRepository(Game).update(gameId, dto)

		if (updateGameRes.affected !== 1) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	async finishGameIfNeed(gameId: string): Promise<LayerResult<null>> {
		const getGameRes = await this.getGameById(gameId)
		if (getGameRes.code !== LayerSuccessCode.Success || !getGameRes.data) {
			return {
				code: LayerSuccessCode.Success,
				data: null,
			}
		}

		const firstPlayerFinished =
			getGameRes.data.firstPlayer.answers.length === gameConfig.questionsNumber
		const secondPlayerFinished =
			getGameRes.data.secondPlayer &&
			getGameRes.data.secondPlayer.answers.length === gameConfig.questionsNumber

		if (firstPlayerFinished && secondPlayerFinished) {
			await this.dataSource
				.getRepository(Game)
				.update(gameId, { finishGameDate: new Date(), status: GameStatus.Finished })
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	mapDbGameToServiceGame(dbGame: Game): GameServiceModel.Main {
		let secondPlayer = null
		if (dbGame.secondPlayer) {
			secondPlayer = preparePlayerData(dbGame.secondPlayer)
		}

		return {
			id: dbGame.id.toString(),
			status: dbGame.status,
			firstPlayer: preparePlayerData(dbGame.firstPlayer),
			secondPlayer,
			gameQuestions: prepareQuestions(dbGame.gameQuestions),
			pairCreatedDate: dbGame.createdAt.toISOString(),
			startGameDate: convertDate(dbGame.startGameDate),
			finishGameDate: convertDate(dbGame.finishGameDate),
		}

		function preparePlayerData(dbPlayer: GamePlayer): GameServiceModel.Player {
			return {
				id: dbPlayer.id.toString(),
				login: dbPlayer.user.login,
				answers: dbPlayer.answers.map((answer) => {
					return {
						id: answer.id.toString(),
						answerStatus: answer.status,
						questionId: answer.questionId,
						addedAt: answer.createdAt.toISOString(),
					}
				}),
				user: dbPlayer.user,
				score: dbPlayer.score,
			}
		}

		function prepareQuestions(gameQuestions: GameQuestion[]): GameServiceModel.GameQuestion[] {
			return gameQuestions.map((gameQuestion) => {
				return {
					id: gameQuestion.id.toString(),
					question: {
						questionId: gameQuestion.questionId,
						body: gameQuestion.question.body,
						correctAnswers: gameQuestion.question.correctAnswers,
					},
				}
			})
		}

		function convertDate(date: null | string | Date): null | string {
			if (!date) {
				return null
			}

			if (typeof date === 'string') {
				const isoDate = new Date(date).toISOString()
				return isoDate ?? date
			}

			return date.toISOString()
		}
	}
}
