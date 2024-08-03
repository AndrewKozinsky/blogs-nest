import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm'
import { GamePlayer } from './gamePlayer'
import { Question } from './question'

export enum GameAnswerStatus {
	Correct = 'Correct',
	Incorrect = 'Incorrect',
}

@Entity()
export class GameAnswer {
	@PrimaryGeneratedColumn()
	id: string

	@ManyToOne(() => GamePlayer, { onDelete: 'CASCADE' })
	player: GamePlayer
	@Column({ type: 'varchar' })
	playerId: string

	@ManyToOne(() => Question)
	gameQuestion: Question
	@Column({ type: 'varchar' })
	gameQuestionId: string

	@Column({ type: 'varchar' })
	status: GameAnswerStatus

	@CreateDateColumn()
	createdAt: Date
}
