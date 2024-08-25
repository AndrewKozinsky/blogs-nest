import { ItemsOutModel } from '../common'

export type QuestionOutModel = {
	id: string
	body: string
	correctAnswers: string[]
	published: boolean
	createdAt: string // "2024-07-21T08:59:26.931Z"
	updatedAt: null | string // "2024-07-21T08:59:26.931Z"
}

export type GetQuestionsOutModel = ItemsOutModel<QuestionOutModel>

export type GetQuestionOutModel = QuestionOutModel
