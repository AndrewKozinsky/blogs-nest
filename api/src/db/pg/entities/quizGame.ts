import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm'
import { QuizGameQuestion } from './quizGameQuestion'
import { QuizPlayer } from './quizPlayer'
import { User } from './user'

export enum GameStatus {
	Pending = 'PendingSecondPlayer',
	Active = 'Active',
	Finished = 'Finished',
}

@Entity()
export class QuizGame {
	@PrimaryGeneratedColumn()
	id: string

	@Column({ type: 'varchar' })
	status: GameStatus

	@JoinColumn()
	@OneToOne(() => QuizPlayer, { onDelete: 'CASCADE' })
	firstPlayer: QuizPlayer
	@Column({ type: 'varchar' })
	firstPlayerId: string

	@JoinColumn()
	@OneToOne(() => QuizPlayer, { onDelete: 'CASCADE', nullable: true })
	secondPlayer: null | QuizPlayer
	@Column({ type: 'varchar', nullable: true })
	secondPlayerId: string

	@OneToMany(() => QuizGameQuestion, (gameQuestion) => gameQuestion.question)
	questions: QuizGameQuestion[]

	@CreateDateColumn()
	createdAt: Date
}
