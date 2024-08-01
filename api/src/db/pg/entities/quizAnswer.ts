import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm'
import { QuizPlayer } from './quizPlayer'
import { QuizQuestion } from './quizQuestion'

export enum GameAnswerStatus {
	Correct = 'Correct',
	Incorrect = 'Incorrect',
}

@Entity()
export class QuizAnswer {
	@PrimaryGeneratedColumn()
	id: string

	@Column({ type: 'varchar' })
	status: GameAnswerStatus

	@ManyToOne(() => QuizPlayer, { onDelete: 'CASCADE' })
	player: QuizPlayer

	@ManyToOne(() => QuizQuestion)
	question: QuizQuestion

	@CreateDateColumn()
	createdAt: Date
}
