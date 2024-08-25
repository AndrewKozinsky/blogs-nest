import { GameAnswerStatus } from '../../db/pg/entities/game/gameAnswer'
import { GameStatus } from '../../db/pg/entities/game/game'

export type GamesOutModel = {
	// Общее количество страниц
	pagesCount: number
	// Номер текущей страницы
	page: number
	// Сколько игр на странице
	pageSize: number
	// Общее количество игр
	totalCount: number
	// Игры на указанной странице
	items: GameOutModel.Main[]
}

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

export type TopStatisticsOutModel = {
	// Общее количество страниц
	pagesCount: number
	// Номер текущей страницы
	page: number
	// Сколько игр на странице
	pageSize: number
	// Общее количество игр
	totalCount: number
	// Игры на указанной странице
	items: StatisticWithPlayer[]
}

export type Statistic = {
	// Сумма всех набранных баллов
	sumScore: number
	// Средний балл на игру. Округляем до 2-х знаков после запятой (например 2.43, 5.55, но не 2.00, а 2).
	avgScores: number
	// Количество игр у этого пользователя
	gamesCount: number
	// Количество игр, где пользователь победил
	winsCount: number
	// Количество игр, где пользователь проиграл
	lossesCount: number
	// Количество игр, где ничья
	drawsCount: number
}

export type StatisticWithPlayer = Statistic & {
	player: {
		id: string
		login: string
	}
}
