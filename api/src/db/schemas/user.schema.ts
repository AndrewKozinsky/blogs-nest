import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type UserDocument = HydratedDocument<User>

@Schema()
export class User {
	@Prop(
		raw({
			login: { type: String, require: true },
			email: { type: String, require: true },
			password: { type: String, require: true },
			passwordRecoveryCode: { type: String, require: false },
			createdAt: { type: String, require: true },
		}),
	)
	account: Record<string, any>

	@Prop(
		raw({
			confirmationCode: { type: String, require: true },
			expirationDate: { type: Date, require: true },
			isConfirmed: { type: Boolean, require: true },
		}),
	)
	emailConfirmation: Record<string, any>
}

export const UserSchema = SchemaFactory.createForClass(User)
