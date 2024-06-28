import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Post } from './post'
import { User } from './user'

@Entity()
export class Comment {
	@PrimaryGeneratedColumn()
	id: string

	@Column('text')
	content: string

	@Column('varchar')
	createdAt: string

	@ManyToOne(() => Post, { onDelete: 'CASCADE' })
	post: Post

	@Column('varchar')
	postId: string

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	user: User

	@Column('varchar')
	userId: string
}
