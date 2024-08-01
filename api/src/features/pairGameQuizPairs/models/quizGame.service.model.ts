import { GameStatus } from '../../../db/pg/entities/quizGame'

export type QuizGameServiceModel = {
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

export type QuizPlayerServiceModel = {
	id: string
	login: string
}
