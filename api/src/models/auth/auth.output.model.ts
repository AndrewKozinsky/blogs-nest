export type MeOutModel = {
	email: string
	login: string
	userId: string
}

export type DeviceTokenOutModel = {
	issuedAt: Date
	expirationDate: Date
	deviceIP: string
	deviceId: string
	deviceName: string
	userId: string
}
