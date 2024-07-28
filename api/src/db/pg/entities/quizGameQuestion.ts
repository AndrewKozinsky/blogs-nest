import { Column, Entity, ManyToOne } from 'typeorm'
import { QuizGame } from './quizGame'
import { QuizQuestion } from './quizQuestion'

@Entity()
export class QuizGameQuestion {
	@ManyToOne(() => QuizGame, { onDelete: 'CASCADE' })
	game: string
	@Column('varchar')
	gameId: string

	@ManyToOne(() => QuizQuestion, { onDelete: 'CASCADE' })
	question: string
	@Column('varchar')
	questionId: string

	@Column('varchar')
	index: number
}
