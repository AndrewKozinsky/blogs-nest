import { Column, PrimaryGeneratedColumn } from 'typeorm'

export class RateLimit {
	@PrimaryGeneratedColumn()
	id: number

	@Column('varchar')
	ip: string

	@Column('varchar')
	date: string

	@Column('varchar')
	path: string

	@Column('varchar')
	method: string
}
