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
	passwordrecoverycode?: string
	createdat: string
	emailconfirmationcode: string
	confirmationcodeexpirationdate: string
	isconfirmationemailcodeconfirmed: boolean
}

export type PGGetPostQuery = {
	id: string // '10'
	title: string
	shortdescription: string
	content: string
	createdat: string
	blogid: string
	blogname: string
}

export type PGGetCommentQuery = {
	id: string
	content: string
	postid: string
	userid: string
	userlogin: string
	createdat: string
	likescount: number
	dislikescount: number
	currentusercommentlikestatus: string
}

export type PGGetDeviceTokensQuery = {
	id: string
	issuedat: string
	userid: string
	expirationdate: string
	deviceip: string
	deviceid: string
	devicename: string
}
