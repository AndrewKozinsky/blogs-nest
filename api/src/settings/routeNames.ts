export const RouteNames = {
	BLOGS: {
		value: 'blogs',
		BLOG_ID(blogId: string) {
			return {
				value: blogId,
				full: 'blogs/' + blogId,
				POSTS: {
					value: 'posts',
					full: 'blogs/' + blogId + '/posts',
				},
			}
		},
	},
	POSTS: {
		value: 'posts',
		POST_ID(postId: string) {
			return {
				value: postId,
				full: 'posts/' + postId,
				COMMENTS: {
					value: 'comments',
					full(tail: string = '') {
						return 'posts/' + postId + '/comments' + tail
					},
				},
				LIKE_STATUS: {
					value: 'like-status',
					full: 'posts/' + postId + '/like-status',
				},
			}
		},
	},
	USERS: {
		value: 'sa/users',
		USER_ID(userId: string) {
			return {
				value: userId,
				full: 'sa/users/' + userId,
			}
		},
	},
	AUTH: {
		value: 'auth',
		LOGIN: {
			value: 'login',
			full: 'auth/login',
		},
		REFRESH_TOKEN: {
			value: 'refresh-token',
			full: 'auth/refresh-token',
		},
		REGISTRATION: {
			value: 'registration',
			full: 'auth/registration',
		},
		REGISTRATION_EMAIL_RESENDING: {
			value: 'registration-email-resending',
			full: 'auth/registration-email-resending',
		},
		REGISTRATION_CONFIRMATION: {
			value: 'registration-confirmation',
			full: 'auth/registration-confirmation',
		},
		LOGOUT: {
			value: 'logout',
			full: 'auth/logout',
		},
		PASSWORD_RECOVERY: {
			value: 'password-recovery',
			full: 'auth/password-recovery',
		},
		NEW_PASSWORD: {
			value: 'new-password',
			full: 'auth/new-password',
		},
		ME: {
			value: 'me',
			full: 'auth/me',
		},
	},
	COMMENTS: {
		value: 'comments',
		COMMENT_ID(commentId: string) {
			return {
				value: commentId,
				full: 'comments/' + commentId,
				LIKE_STATUS: {
					value: 'like-status',
					full: 'comments/' + commentId + '/like-status',
				},
			}
		},
	},
	SECURITY: {
		value: 'security',
		DEVICES: {
			value: 'devices',
			full: 'security/devices',
			DEVICE_ID(deviceId: string) {
				return {
					value: deviceId,
					full: 'security/devices/' + deviceId,
				}
			},
		},
	},
	TESTING: {
		value: 'testing',
		ALL_DATA: {
			value: 'all-data',
			full: 'testing/all-data',
		},
	},
}

export default RouteNames
