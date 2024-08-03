import { GameAnswerStatus } from '../../../db/pg/entities/game/gameAnswer'
import { GameStatus } from '../../../db/pg/entities/game/game'

export type GameOutModel = {
	id: string
	status: GameStatus
	firstPlayer: {
		id: string
		login: string
	}
	secondPlayer: null | {
		id: string
		login: string
	}
	questions: {
		id: string
		body: string
	}[]
	pairCreatedDate: string
}

export type GamePlayerOutModel = {
	id: string
	login: string
}

export namespace ConnectionResult {
	export type Main = {
		// Id of pair
		id: string
		firstPlayerProgress: PlayerProgress
		secondPlayerProgress: null | PlayerProgress
		// Questions for both players (can be null if second player haven't connected yet)
		questions: null | Question[]
		status: GameStatus
		// Date when first player initialized the pair
		pairCreatedDate: string // '2024-07-28T07:45:51.040Z'
		// Game starts immediately after second player connection to this pair
		startGameDate: null | string // '2024-07-28T07:45:51.040Z'
		// Game finishes immediately after both players have answered all the questions
		finishGameDate: null | string // '2024-07-28T07:45:51.040Z'
	}

	type PlayerProgress = {
		answers: Answer[]
		player: Player
		score: number
	}

	type Question = {
		id: string
		body: string
	}

	type Answer = {
		questionId: string
		answerStatus: GameAnswerStatus
		addedAt: string // '2024-07-28T07:45:51.040Z'
	}

	type Player = {
		id: string
		login: string
	}
}

export type GameAnswerOutModel = {
	gameQuestionId: string
	answerStatus: GameAnswerStatus
	addedAt: string
}
