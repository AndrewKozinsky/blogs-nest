import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Game } from './game'
import { Question } from './question'

@Entity()
export class GameQuestion {
	@PrimaryGeneratedColumn()
	id: string

	@ManyToOne(() => Game, { onDelete: 'CASCADE' })
	game: Game
	@Column('varchar')
	gameId: string

	@ManyToOne(() => Question, { onDelete: 'CASCADE' })
	question: Question
	@Column('varchar')
	questionId: string

	@Column('int')
	index: number
}
