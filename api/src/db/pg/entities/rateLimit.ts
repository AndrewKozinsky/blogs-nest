import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class RateLimit {
	@PrimaryGeneratedColumn()
	id: string

	@Column('varchar')
	ip: string

	@Column('varchar')
	date: string

	@Column('varchar')
	path: string

	@Column('varchar')
	method: string
}
