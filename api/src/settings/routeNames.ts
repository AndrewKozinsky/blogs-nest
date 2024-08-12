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
	SA_BLOGS: {
		value: 'sa/blogs',
		SA_BLOG_ID(blogId: string) {
			return {
				value: blogId,
				full: 'sa/blogs/' + blogId,
				POSTS: {
					value: 'posts',
					full: 'sa/blogs/' + blogId + '/posts',
				},
				POST_ID(postId: string) {
					return {
						value: postId,
						full: 'sa/blogs/' + blogId + '/posts/' + postId,
					}
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
	SA_QUESTIONS: {
		value: 'sa/quiz/questions',
		QUESTION_ID(questionId: string) {
			return {
				value: questionId,
				full: `sa/quiz/questions/${questionId}`,
				PUBLISH: {
					value: 'publish',
					full: `sa/quiz/questions/${questionId}/publish`,
				},
			}
		},
	},
	PAIR_GAME: {
		value: 'pair-game-quiz',
		PAIRS: {
			value: 'pairs',
			full: 'pair-game-quiz/pairs',
			MY_GAMES: {
				value: 'my',
				full: 'pair-game-quiz/pairs/my',
			},
			GAME_ID(gameId: string) {
				return {
					value: gameId,
					full: `pair-game-quiz/pairs/${gameId}`,
				}
			},
			CONNECTION: {
				value: 'connection',
				full: 'pair-game-quiz/pairs/connection',
			},
			MY_CURRENT: {
				value: 'my-current',
				full: 'pair-game-quiz/pairs/my-current',
				ANSWERS: {
					value: 'answers',
					full: 'pair-game-quiz/pairs/my-current/answers',
				},
			},
		},
		USERS: {
			value: 'users',
			full: 'pair-game-quiz/users',
			MY_STATISTIC: {
				value: 'my-statistic',
				full: 'pair-game-quiz/users/my-statistic',
			},
		},
	},
}

export default RouteNames
