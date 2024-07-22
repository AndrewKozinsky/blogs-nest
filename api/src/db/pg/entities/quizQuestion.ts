import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class QuizQuestion {
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
}
