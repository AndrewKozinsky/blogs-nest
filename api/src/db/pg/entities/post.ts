import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Blog } from './blog.entity'

@Entity()
export class Post {
	@PrimaryGeneratedColumn()
	id: number

	@Column('varchar')
	title: string

	@Column('varchar')
	shortDescription: string

	@Column('text')
	content: string

	@Column('varchar')
	createdAt: string

	@ManyToOne(() => Blog)
	blog: boolean
}
