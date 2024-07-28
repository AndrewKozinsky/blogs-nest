export type QuizGameOutModel = {
	id: string
	status: 'pending' | 'active' | 'finished'
	player_1Id: string
	player_2Id: string
	questions: string[]
}
