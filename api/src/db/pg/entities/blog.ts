import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class Blog {
	@PrimaryGeneratedColumn()
	id: string

	@Column({ type: 'varchar', collation: 'C' })
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
