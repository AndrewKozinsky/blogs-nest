import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type DeviceTokenDocument = HydratedDocument<DeviceToken>

@Schema()
export class DeviceToken {
	@Prop({ required: true })
	issuedAt: Date

	@Prop({ required: true })
	userId: string

	@Prop({ required: true })
	expirationDate: Date

	@Prop({ required: true })
	deviceIP: string

	@Prop({ required: true })
	deviceId: string

	@Prop({ required: true })
	deviceName: string
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken)
