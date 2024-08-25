import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, FindOptionsWhere, MoreThan, Not } from 'typeorm'
import { Game, GameStatus } from '../../db/pg/entities/game/game'
import { GameAnswer, GameAnswerStatus } from '../../db/pg/entities/game/gameAnswer'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { GameQuestion } from '../../db/pg/entities/game/gameQuestion'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { gameConfig } from '../../routes/pairGame/config'
import { GameAnswerRepository } from './gameAnswer.repository'
import { GameServiceModel } from '../../models/pairGame/game.service.model'

type GameAnswersStatus =
	| 'noneAnsweredAllQuestions'
	| 'oneAnsweredAllQuestions'
	| 'bothAnsweredAllQuestions'

@Injectable()
export class GameRepository {
	constructor(
		@InjectDataSource() private dataSource: DataSource,
		private gameAnswerRepository: GameAnswerRepository,
	) {}

	async getUserGames(userId: string): Promise<LayerResult<GameServiceModel.Main[]>> {
		const getGamesRes = await this.getGamesByOptions({
			where: this.getWhereConditionWhereGameHasUserWithId(userId),
		})

		if (getGamesRes.code !== LayerSuccessCode.Success) {
			return getGamesRes
		}

		return {
			code: LayerSuccessCode.Success,
			data: getGamesRes.data,
		}
	}

	async getPendingGames(): Promise<LayerResult<null | GameServiceModel.Main[]>> {
		return this.getGamesByOptions({ where: { status: GameStatus.Pending } })
	}

	async getUnfinishedGames(): Promise<LayerResult<null | GameServiceModel.Main[]>> {
		return this.getGamesByOptions({ where: { status: Not(GameStatus.Finished) } })
	}

	async getPendingGame(): Promise<LayerResult<null | GameServiceModel.Main>> {
		const getGamesRes = await this.getGamesByOptions({ where: { status: GameStatus.Pending } })

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
		const getGamesRes = await this.getGamesByOptions({ where: { id: gameId } })

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
		const getGamesRes = await this.getGamesByOptions({
			where: [{ firstPlayerId: playerId }, { secondPlayerId: playerId }],
		})

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
		const getGamesRes = await this.getGamesByOptions({
			where: this.getWhereConditionWhereUnfinishedGameHasUserWithId(userId),
		})

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

	private async getGamesByOptions(options: {
		where: FindOptionsWhere<Game> | FindOptionsWhere<Game>[] | undefined
	}): Promise<LayerResult<GameServiceModel.Main[]>> {
		const getGameRes = await this.dataSource.getRepository(Game).find({
			where: options.where,
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

	private getWhereConditionWhereGameHasUserWithId(
		userId: string,
	): FindOptionsWhere<Game> | FindOptionsWhere<Game>[] {
		return [
			{
				firstPlayer: {
					user: {
						id: userId,
					},
				},
			},
			{
				secondPlayer: {
					user: {
						id: userId,
					},
				},
			},
		]
	}

	private getWhereConditionWhereUnfinishedGameHasUserWithId(
		userId: string,
	): FindOptionsWhere<Game> | FindOptionsWhere<Game>[] {
		return [
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
		]
	}

	async getGameAnswersStatus(gameId: string): Promise<LayerResult<GameAnswersStatus>> {
		const getGameRes = await this.getGameById(gameId)
		if (getGameRes.code !== LayerSuccessCode.Success || !getGameRes.data) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		const firstPlayerFinished =
			getGameRes.data.firstPlayer.answers.length === gameConfig.questionsNumber
		const secondPlayerFinished =
			getGameRes.data.secondPlayer &&
			getGameRes.data.secondPlayer.answers.length === gameConfig.questionsNumber

		let status: GameAnswersStatus = 'noneAnsweredAllQuestions'
		if (
			(firstPlayerFinished && !secondPlayerFinished) ||
			(secondPlayerFinished && !firstPlayerFinished)
		) {
			status = 'oneAnsweredAllQuestions'
		} else if (firstPlayerFinished && !!secondPlayerFinished) {
			status = 'bothAnsweredAllQuestions'
		}

		return {
			code: LayerSuccessCode.Success,
			data: status,
		}
	}

	// Returns fastest userId or null if
	async getPlayerIdWhichFinishedFirst(gameId: string) {
		const getGameRes = await this.getGameById(gameId)
		if (getGameRes.code !== LayerSuccessCode.Success || !getGameRes.data) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		const { firstPlayer, secondPlayer } = getGameRes.data

		const firstPlayerLastAnswer = firstPlayer.answers[firstPlayer.answers.length - 1]
		const secondPlayerLastAnswer = secondPlayer!.answers[secondPlayer!.answers.length - 1]

		let fastestUserId: null | string = null

		if (firstPlayerLastAnswer.addedAt < secondPlayerLastAnswer.addedAt) {
			const correctAnswers = firstPlayer.answers.filter(
				(answer) => answer.answerStatus === GameAnswerStatus.Correct,
			)
			if (correctAnswers.length) {
				fastestUserId = firstPlayer.id
			}
		} else if (secondPlayerLastAnswer.addedAt < firstPlayerLastAnswer.addedAt) {
			const correctAnswers = secondPlayer!.answers.filter(
				(answer) => answer.answerStatus === GameAnswerStatus.Correct,
			)
			if (correctAnswers.length) {
				fastestUserId = secondPlayer!.id
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: fastestUserId,
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

	/**
	 *
	 * @param gameId
	 * @param gameIsReallyExists — set true if it is really known that the game exists. Then game exist check won't be to increase operation time.
	 */
	async finishGame(gameId: string, gameIsReallyExists?: boolean): Promise<LayerResult<null>> {
		if (!gameIsReallyExists) {
			const getGameRes = await this.getGameById(gameId)
			if (getGameRes.code !== LayerSuccessCode.Success || !getGameRes.data) {
				return {
					code: LayerSuccessCode.Success,
					data: null,
				}
			}
		}

		await this.dataSource
			.getRepository(Game)
			.update(gameId, { finishGameDate: new Date(), status: GameStatus.Finished })

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	async finishGamesWhereTimeRunOut(): Promise<LayerResult<null>> {
		const getGamesWhereTimeRunOutRes = await this.getGamesByOptions({
			where: { gameMustBeCompletedNoLaterThan: MoreThan(new Date()) },
		})

		if (getGamesWhereTimeRunOutRes.code !== LayerSuccessCode.Success) {
			return getGamesWhereTimeRunOutRes
		}

		const games = getGamesWhereTimeRunOutRes.data

		for (const game of games) {
			await this._forceFinishExistingGame(game)
		}

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	async forceFinishGame(gameId: string): Promise<LayerResult<null>> {
		const getGameRes = await this.getGameById(gameId)
		if (getGameRes.code !== LayerSuccessCode.Success || !getGameRes.data) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}
		const game = getGameRes.data

		await this._forceFinishExistingGame(game)

		return {
			code: LayerSuccessCode.Success,
			data: null,
		}
	}

	async _forceFinishExistingGame(game: GameServiceModel.Main) {
		const _self = this

		const firstPlayer = game.firstPlayer
		const secondPlayer = game.secondPlayer!

		if (
			!game.gameMustBeCompletedNoLaterThan ||
			game.status === GameStatus.Finished ||
			new Date(game.gameMustBeCompletedNoLaterThan) > new Date() ||
			!secondPlayer
		) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		const firstPlayerFinished = firstPlayer.answers.length === gameConfig.questionsNumber
		const secondPlayerFinished = secondPlayer.answers.length === gameConfig.questionsNumber

		if (firstPlayerFinished && secondPlayerFinished) {
			return {
				code: LayerErrorCode.BadRequest_400,
			}
		}

		if (!firstPlayerFinished) {
			await giveWrongAnswersToPlayer(firstPlayer)
			await increaseScoreIfPlayerGiveAtLeastOneRightAnswer(secondPlayer)
		} else if (!secondPlayerFinished) {
			await giveWrongAnswersToPlayer(secondPlayer)
			await increaseScoreIfPlayerGiveAtLeastOneRightAnswer(firstPlayer)
		}

		await this.finishGame(game.id, true)

		async function giveWrongAnswersToPlayer(player: GameServiceModel.Player) {
			const unansweredQuestionsNum = gameConfig.questionsNumber - player.answers.length
			const unansweredQuestions = game.gameQuestions.slice(unansweredQuestionsNum)

			for (const unansweredQuestion of unansweredQuestions) {
				await _self.gameAnswerRepository.createGameAnswer(
					player.id,
					unansweredQuestion.question.questionId,
					GameAnswerStatus.Incorrect,
				)
			}
		}

		async function increaseScoreIfPlayerGiveAtLeastOneRightAnswer(
			player: GameServiceModel.Player,
		) {
			if (
				player?.answers.filter((answer) => answer.answerStatus === GameAnswerStatus.Correct)
					.length
			) {
				await _self.dataSource
					.getRepository(GamePlayer)
					.update(player.id, { score: player.score + 1 })
			}
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
			gameMustBeCompletedNoLaterThan: convertDate(dbGame.startGameDate),
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
