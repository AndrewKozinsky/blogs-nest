import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type CommentDocument = HydratedDocument<Comment>

@Schema()
export class Comment {
	@Prop({ required: true })
	postId: string

	@Prop({ required: true })
	content: string

	@Prop(
		raw({
			userId: { type: String, require: true },
			userLogin: { type: String, require: true },
		}),
	)
	commentatorInfo: Record<string, any>

	@Prop({ required: true })
	createdAt: string
}

export const CommentSchema = SchemaFactory.createForClass(Comment)
