import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'
import { GameQuestion } from './gameQuestion'

@Entity()
export class Question {
	@PrimaryGeneratedColumn()
	id: string

	@Column({ type: 'varchar' })
	body: string

	@Column('varchar', { array: true })
	correctAnswers: string[]

	@Column('boolean')
	published: boolean

	@CreateDateColumn()
	createdAt: Date

	@UpdateDateColumn()
	updatedAt: Date

	@OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.question)
	gameQuestions: GameQuestion[]
}
