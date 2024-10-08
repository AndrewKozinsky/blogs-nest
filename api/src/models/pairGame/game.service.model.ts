import { GameAnswerStatus } from '../../db/pg/entities/game/gameAnswer'
import { GameStatus } from '../../db/pg/entities/game/game'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { Question } from '../../db/pg/entities/game/question'
import GameQuestion = GameServiceModel.GameQuestion

export namespace GameServiceModel {
	export type Main = {
		// Id of pair
		id: string
		status: GameStatus
		firstPlayer: Player
		secondPlayer: null | Player
		// Questions for both players (can be null if second player haven't connected yet)
		gameQuestions: GameQuestion[]

		// Date when first player initialized the pair
		pairCreatedDate: string // '2024-07-28T07:45:51.040Z'
		// Game starts immediately after second player connection to this pair
		startGameDate: null | string // '2024-07-28T07:45:51.040Z'
		// Max date when the game must be completed
		gameMustBeCompletedNoLaterThan: null | string // '2024-07-28T07:45:51.040Z'
		// Game finishes immediately after both players have answered all the questions
		finishGameDate: null | string // '2024-07-28T07:45:51.040Z'
	}

	export type Player = {
		id: string
		login: string
		answers: Answer[]
		user: User
		score: number
	}

	export type GameQuestion = {
		id: string
		question: {
			questionId: string
			body: string
			correctAnswers: string[]
		}
	}

	export type Answer = {
		questionId: string
		answerStatus: GameAnswerStatus
		addedAt: string // '2024-07-28T07:45:51.040Z'
	}

	type User = {
		id: string
		login: string
	}
}

export type GamePlayerServiceModel = {
	id: string
	user: {
		login: string
	}
	score: number
	answers: {
		id: string
		status: GameAnswerStatus
		player: {
			id: string
		}
		question: {
			id: string
			body: string
		}
		createdAt: string
	}[]
}

export type GameQuestionServiceModel = {
	id: string
	gameId: string
	index: number
	question: {
		questionId: string
		correctAnswers: string[]
	}
}
