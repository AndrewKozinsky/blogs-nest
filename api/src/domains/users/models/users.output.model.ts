import { ItemsOutModel } from '../../common/models/common'

export type UserOutModel = {
	id: string
	login: string
	email: string
	createdAt: string
}

export type GetUsersOutModel = ItemsOutModel<UserOutModel>

export type GetUserOutModel = UserOutModel
