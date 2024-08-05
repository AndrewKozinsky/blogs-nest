import { UpdateDateColumn } from 'typeorm'
import {
	BeforeUpdate,
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
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

	@Column({ type: 'timestamp', nullable: true })
	updatedAt: Date

	@OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.question)
	gameQuestions: GameQuestion[]
}
