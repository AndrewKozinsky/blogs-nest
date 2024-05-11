import { UserServiceModel } from '../models/service/users.service.model'

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			AUTH_LOGIN: string
			AUTH_PASSWORD: string
			JWT_SECRET: 'dev' | 'test'
			MONGO_URL: string
			DB_NAME: string
			DB_TYPE: 'mongo' | 'postgres'
			DB_USER_NAME: string
			DB_USER_PASSWORD: string
			POSTGRES_PORT: number
		}
	}

	namespace Express {
		export interface Request {
			user: null | UserServiceModel
			deviceRefreshToken: undefined | null | DBTypes.DeviceToken
		}
	}
}
