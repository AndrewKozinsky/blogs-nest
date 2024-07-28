import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { QuizGameQuestion } from './quizGameQuestion'
import { QuizPlayer } from './quizPlayer'

@Entity()
export class QuizGame {
	@PrimaryGeneratedColumn()
	id: string

	@Column({ type: 'varchar' })
	status: 'pending' | 'active' | 'finished'

	@OneToOne(() => QuizPlayer, { onDelete: 'CASCADE' })
	player_1: QuizPlayer
	@Column({ type: 'varchar' })
	player_1Id: string

	@OneToOne(() => QuizPlayer, { onDelete: 'CASCADE', nullable: true })
	player_2: null | QuizPlayer
	@Column({ type: 'varchar' })
	player_2Id: string

	@OneToMany(() => QuizGameQuestion, (gameQuestion) => gameQuestion.game)
	questions: string[]
}
