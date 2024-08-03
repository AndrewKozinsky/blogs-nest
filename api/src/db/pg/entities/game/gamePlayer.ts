import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { GameAnswer } from './gameAnswer'
import { User } from '../user'

@Entity()
export class GamePlayer {
	@PrimaryGeneratedColumn()
	id: string

	@ManyToOne(() => User, (u) => u.id, { onDelete: 'CASCADE' })
	user: User
	@Column('varchar')
	userId: string

	@Column({ type: 'int' })
	score: number

	@OneToMany(() => GameAnswer, (quizAnswer) => quizAnswer.player)
	answers: GameAnswer[]
}
