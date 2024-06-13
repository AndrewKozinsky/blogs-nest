import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Blog {
	@PrimaryGeneratedColumn()
	id: number

	@Column('varchar')
	name: string

	@Column('varchar')
	description: string

	@Column('varchar')
	websiteUrl: string

	@Column('varchar')
	createdAt: string

	@Column('boolean')
	isMembership: boolean
}
