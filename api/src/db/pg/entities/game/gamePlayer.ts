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

	// Зачем хранить это значение если его можно вычислить по ответам?
	@Column({ type: 'int' })
	score: number

	@OneToMany(() => GameAnswer, (gameAnswer) => gameAnswer.player)
	answers: GameAnswer[]

	// Выигрывает ли сейчас игрок (требуется для статистики)?
	@Column({ type: 'boolean', default: false })
	isPlayerWinning: boolean

	// Проигрывает ли сейчас игрок (требуется для статистики)?
	@Column({ type: 'boolean', default: false })
	isPlayerLossing: boolean

	// Ничья ли сейчас с соперником (требуется для статистики)?
	@Column({ type: 'boolean', default: false })
	isPlayerDrawing: boolean
}
