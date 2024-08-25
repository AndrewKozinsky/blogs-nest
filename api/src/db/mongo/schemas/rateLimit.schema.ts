/*import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type RateLimitDocument = HydratedDocument<RateLimit>

@Schema()
export class RateLimit {
	@Prop({ required: true })
	ip: string

	@Prop({ required: true })
	date: Date

	@Prop({ required: true })
	path: string

	@Prop({ required: true })
	method: string
}

export const RateLimitSchema = SchemaFactory.createForClass(RateLimit)*/
