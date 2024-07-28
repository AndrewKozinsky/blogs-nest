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

@Entity()
export class QuizAnswer {
	@PrimaryGeneratedColumn()
	id: string

	@Column({ type: 'varchar' })
	status: 'Correct' | 'Incorrect'

	@OneToOne(() => QuizPlayer, { onDelete: 'CASCADE' })
	player: QuizPlayer

	@ManyToOne(() => QuizQuestion)
	question: QuizQuestion

	@CreateDateColumn()
	createdAt: Date
}
