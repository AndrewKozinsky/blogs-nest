import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm'
import { GameQuestion } from './gameQuestion'
import { GamePlayer } from './gamePlayer'
import { User } from '../user'

export enum GameStatus {
	Pending = 'PendingSecondPlayer',
	Active = 'Active',
	Finished = 'Finished',
}

@Entity()
export class Game {
	@PrimaryGeneratedColumn()
	id: string

	@Column({ type: 'varchar' })
	status: GameStatus

	@JoinColumn()
	@OneToOne(() => GamePlayer, { onDelete: 'CASCADE' })
	firstPlayer: GamePlayer
	@Column({ type: 'varchar' })
	firstPlayerId: string

	@JoinColumn()
	@OneToOne(() => GamePlayer, { onDelete: 'CASCADE', nullable: true })
	secondPlayer: null | GamePlayer
	@Column({ type: 'varchar', nullable: true })
	secondPlayerId: string

	@OneToMany(() => GameQuestion, (gameQuestion) => gameQuestion.game)
	gameQuestions: GameQuestion[]

	@CreateDateColumn()
	createdAt: Date

	@Column({ type: 'date', nullable: true })
	startGameDate: Date

	@Column({ type: 'date', nullable: true })
	finishGameDate: Date
}
