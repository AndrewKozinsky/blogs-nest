export type PGGetBlogQuery = {
	id: string // '10'
	name: string // 'Blog name 5'
	description: string // 'Blog description 3'
	websiteurl: string // 'https://PPtZN-E4.AVFOCYMGSKTDXCm2UspxKIfkv8IHre6yaItRQ-MeyiPolsQbiMc0uSUiWDB_oSH.NG'
	createdat: string // 2024-05-19T00:00:00.000Z
	ismembership: boolean // false
}

export type PGGetUserQuery = {
	id: string // '10'
	login: string
	email: string
	password: string
	passwordRecoveryCode?: string
	createdAt: string
	emailConfirmationCode: string
	confirmationCodeExpirationDate: string
	isConfirmationEmailCodeConfirmed: boolean
}
