import { ItemsOutModel } from '../../common/models/common'

export type QuizQuestionOutModel = {
	id: string
	body: string
	correctAnswers: string[]
	published: boolean
	createdAt: string // "2024-07-21T08:59:26.931Z"
	updatedAt: string // "2024-07-21T08:59:26.931Z"
}

export type GetQuizQuestionsOutModel = ItemsOutModel<QuizQuestionOutModel>

export type GetQuizQuestionOutModel = QuizQuestionOutModel
