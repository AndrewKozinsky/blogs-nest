import { Injectable } from '@nestjs/common'
import { LayerResult, LayerResultCode } from '../../../types/resultCodes'
import { SaQuizQuestionsQueryRepository } from '../../saQuizQuestions/saQuizQuestionsQueryRepository'
import { SaQuizQuestionsRepository } from '../../saQuizQuestions/saQuizQuestionsRepository'
import { QuizGameQueryRepository } from '../quizGameQueryRepository'
import { QuizGameQuestionRepository } from '../quizGameQuestionRepository'
import { QuizGameRepository } from '../quizGameRepository'
import { QuizPlayerRepository } from '../quizPlayerRepository'

@Injectable()
export class ConnectToGameUseCase {
	constructor(
		private quizPlayerRepository: QuizPlayerRepository,
		private quizGameQueryRepository: QuizGameQueryRepository,
		private quizGameRepository: QuizGameRepository,
		private quizGameQuestionRepository: QuizGameQuestionRepository,
		private saQuizQuestionsRepository: SaQuizQuestionsRepository,
	) {}

	async execute(userId: string): Promise<LayerResult<any>> {
		// Создать нового игрока
		const createPlayerRes = await this.quizPlayerRepository.createPlayer(userId)
		if (createPlayerRes.code !== LayerResultCode.Success || !createPlayerRes.data) {
			return {
				code: LayerResultCode.BadRequest,
			}
		}
		const newPlayerId = createPlayerRes.data

		// Получить игру с одним игроком
		const getPendingGameRes = await this.quizGameQueryRepository.getPendingGame()
		let gameId = ''

		// Если есть игра с одним игроком
		if (getPendingGameRes.code === LayerResultCode.Success && getPendingGameRes.data) {
			gameId = getPendingGameRes.data.id

			// Добавить игрока в существующую игру и поменять статус игры на active
			const addSecondPlayerRes = await this.quizGameRepository.updateGame(gameId, {
				player_2Id: newPlayerId,
				status: 'active',
			})
			if (addSecondPlayerRes.code !== LayerResultCode.Success) {
				return {
					code: LayerResultCode.BadRequest,
				}
			}
		}
		// Если ожидающей игры нет
		else {
			// Создать игру с одним игроком
			const newGameRes = await this.createEmptyGame(newPlayerId)
			if (newGameRes.code !== LayerResultCode.Success || !newGameRes.data) {
				return {
					code: LayerResultCode.BadRequest,
				}
			}

			gameId = newGameRes.data
		}

		// -----
		return {
			code: LayerResultCode.Success,
			data: {
				id: 'string', // Id of pair
				firstPlayerProgress: {
					answers: [
						{
							questionId: 'string',
							answerStatus: 'Correct', // Correct, Incorrect
							addedAt: '2024-07-28T07:45:51.040Z',
						},
					],
					player: {
						id: 'string',
						login: 'string',
					},
					score: 0,
				},
				secondPlayerProgress: {
					answers: [
						{
							questionId: 'string',
							answerStatus: 'Correct', // Correct, Incorrect
							addedAt: '2024-07-28T07:45:51.040Z',
						},
					],
					player: {
						id: 'string',
						login: 'string',
					},
					score: 0,
				},
				// Questions for both players (can be null if second player haven't connected yet)
				questions: [
					{
						id: 'string',
						body: 'string',
					},
				],
				status: 'PendingSecondPlayer', // PendingSecondPlayer, Active, Finished
				// Date when first player initialized the pair
				pairCreatedDate: '2024-07-28T07:45:51.040Z',
				// Game starts immediately after second player connection to this pair
				startGameDate: '2024-07-28T07:45:51.040Z',
				// Game finishes immediately after both players have answered all the questions
				finishGameDate: '2024-07-28T07:45:51.040Z',
			},
		}
	}

	/**
	 * Создаёт новую игру
	 * @param firstPlayerId
	 */
	async createEmptyGame(firstPlayerId: string) {
		const createNewGameRes = await this.quizGameRepository.createGame(firstPlayerId)
		if (createNewGameRes.code !== LayerResultCode.Success || !createNewGameRes.data) {
			return {
				code: LayerResultCode.BadRequest,
			}
		}

		// Создать 5 вопросов к игре
		const gameId = createNewGameRes.data
		await this.createGameRandomQuestions(gameId)

		return createNewGameRes
	}

	/**
	 * Cоздаёт 5 случайных вопросов игры.
	 * @param gameId
	 */
	async createGameRandomQuestions(gameId: string) {
		// Получить 5 случайных вопросов
		const getRandomQuestionsRes = await this.saQuizQuestionsRepository.getRandomQuestions(5)
		if (getRandomQuestionsRes.code !== LayerResultCode.Success || !getRandomQuestionsRes.data) {
			return {
				code: LayerResultCode.BadRequest,
			}
		}

		const gameQuestionQueries = []
		for (let i = 0; i < getRandomQuestionsRes.data.length; i++) {
			const question = getRandomQuestionsRes.data[i]
			const questionId = question.id

			gameQuestionQueries.push(
				this.quizGameQuestionRepository.createGameQuestion(gameId, questionId, i),
			)
		}

		await Promise.all(gameQuestionQueries)
	}
}
