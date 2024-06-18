import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Post } from './post'
import { User } from './user'

@Entity()
export class Comment {
	@PrimaryGeneratedColumn()
	id: string

	@Column('text')
	content: string

	@ManyToOne(() => Post)
	post: Post

	@ManyToOne(() => User)
	user: User

	@Column('varchar')
	createdAt: string
}
