export const config = {
	port: 3000,
	refreshToken: {
		name: 'refreshToken',
		lifeDurationInMs: 1000 * 20 * 1000, // 20 sec
	},
	accessToken: {
		name: 'accessToken',
		lifeDurationInMs: 1000 * 10 * 1000, // 10 sec
	},
	reqLimit: {
		max: 5,
		durationInMs: 10 * 1000, // 10 seconds
	},
	JWT_SECRET: process.env.JWT_SECRET || '123',
}

export const HTTP_STATUSES = {
	OK_200: 200,
	CREATED_201: 201,
	NO_CONTENT_204: 204,

	BAD_REQUEST_400: 400,
	UNAUTHORIZED_401: 401,
	FORBIDDEN_403: 403,
	NOT_FOUNT_404: 404,
	TOO_MANY_REQUESTS_429: 429,

	SERVER_ERROR_500: 500,
}
