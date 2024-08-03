import { GameAnswerStatus } from '../../../db/pg/entities/game/gameAnswer'
import { GameStatus } from '../../../db/pg/entities/game/game'
import { GamePlayer } from '../../../db/pg/entities/game/gamePlayer'
import { Question } from '../../../db/pg/entities/game/question'

export type GameServiceModel = {
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
	gameQuestions: {
		id: string
		body: string
		correctAnswers: string[]
	}[]
	pairCreatedDate: string
}

export type GamePlayerServiceModel = {
	id: string
	user: {
		login: string
	}
	answers: {
		id: string
		status: GameAnswerStatus
		player: GamePlayer
		question: Question
		createdAt: Date
	}[]
}
