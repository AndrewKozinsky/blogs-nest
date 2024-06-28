export type UserServiceModel = {
	id: string
	account: {
		login: string
		email: string
		password: string
		passwordRecoveryCode: string | null
		createdAt: string
	}
	emailConfirmation: {
		confirmationCode: string
		expirationDate: Date
		isConfirmed: boolean
	}
}
