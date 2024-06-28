import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Comment } from './comment'
import { User } from './user'

@Entity()
export class CommentLikes {
	@PrimaryGeneratedColumn()
	id: string

	@Column('varchar')
	status: string

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	user: User

	@Column('varchar')
	userId: string

	@ManyToOne(() => Comment, { onDelete: 'CASCADE' })
	comment: Comment

	@Column('varchar')
	commentId: string
}
