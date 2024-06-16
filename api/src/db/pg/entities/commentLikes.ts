import { Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Comment } from './comment'
import { User } from './user'

export class CommentLikes {
	@PrimaryGeneratedColumn()
	id: string

	@ManyToOne(() => Comment)
	comment: Comment

	@ManyToOne(() => User)
	user: User

	@Column('varchar')
	status: string
}
