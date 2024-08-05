import { GameAnswerStatus } from '../../../db/pg/entities/game/gameAnswer'
import { GameStatus } from '../../../db/pg/entities/game/game'

export namespace GameOutModel {
	export type Main = {
		// Id of pair
		id: string
		status: GameStatus
		firstPlayerProgress: Player
		secondPlayerProgress: null | Player
		// Questions for both players (can be null if second player haven't connected yet)
		questions: null | Question[]

		// Date when first player initialized the pair
		pairCreatedDate: string // '2024-07-28T07:45:51.040Z'
		// Game starts immediately after second player connection to this pair
		startGameDate: null | string // '2024-07-28T07:45:51.040Z'
		// Game finishes immediately after both players have answered all the questions
		finishGameDate: null | string // '2024-07-28T07:45:51.040Z'
	}

	export type Player = {
		answers: Answer[]
		player: User
		score: number
	}

	export type Question = {
		id: string
		body: string
	}

	type Answer = {
		questionId: string
		answerStatus: GameAnswerStatus
		addedAt: string // '2024-07-28T07:45:51.040Z'
	}

	type User = {
		id: string
		login: string
	}
}

export type GameAnswerOutModel = {
	questionId: string
	answerStatus: GameAnswerStatus
	addedAt: string
}

export type GamePlayerOutModel = {
	id: string
	login: string
}
