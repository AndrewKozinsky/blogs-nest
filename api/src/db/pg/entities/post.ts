import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Blog } from './blog'

@Entity()
export class Post {
	@PrimaryGeneratedColumn()
	id: string

	@Column('varchar')
	title: string

	@Column('varchar')
	shortDescription: string

	@Column('text')
	content: string

	@Column('varchar')
	createdAt: string

	@ManyToOne(() => Blog)
	blog: Blog

	@Column('varchar')
	blogId: string
}
