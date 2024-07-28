import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { QuizAnswer } from './quizAnswer'
import { User } from './user'

@Entity()
export class QuizPlayer {
	@PrimaryGeneratedColumn()
	id: string

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	user: User
	@Column('varchar')
	userId: string

	@Column({ type: 'int' })
	score: number

	@OneToMany(() => QuizAnswer, (quizAnswer) => quizAnswer.player)
	answers: QuizAnswer[]
}
