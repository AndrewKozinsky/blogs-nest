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

	@Column({ type: 'timestamp', nullable: true })
	startGameDate: Date

	// Max date when the game must be completed
	@Column({ type: 'timestamp', nullable: true })
	gameMustBeCompletedNoLaterThan: Date

	@Column({ type: 'timestamp', nullable: true })
	finishGameDate: Date
}
