import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { LikeStatuses } from '../../src/db/pg/entities/postLikes'
import {
	CreatePostCommentDtoModel,
	CreatePostDtoModel,
} from '../../src/models/posts/posts.input.model'
import { HTTP_STATUSES } from '../../src/settings/config'
import RouteNames from '../../src/settings/routeNames'
import { adminAuthorizationValue } from './common'

export const postUtils = {
	createDtoAddPost(
		blogId: string,
		newPostObj: Partial<CreatePostDtoModel> = {},
	): CreatePostDtoModel {
		return Object.assign(
			{
				title: 'title',
				shortDescription: 'shortDescription',
				content: 'content',
				blogId,
			},
			newPostObj,
		)
	},
	async addPostRequest(
		app: INestApplication,
		blogId: string,
		postDto: Partial<CreatePostDtoModel> = {},
	) {
		return request(app.getHttpServer())
			.post('/' + RouteNames.POSTS.value)
			.set('authorization', adminAuthorizationValue)
			.send(this.createDtoAddPost(blogId, postDto))
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
	},
	checkPostObj(
		postObj: any,
		likesCount: number,
		dislikesCount: number,
		currentUserLikeStatus: LikeStatuses,
	) {
		expect(postObj._id).toBe(undefined)
		expect(typeof postObj.id).toBe('string')
		expect(typeof postObj.title).toBe('string')
		expect(typeof postObj.shortDescription).toBe('string')
		expect(typeof postObj.content).toBe('string')
		expect(typeof postObj.blogId).toBe('string')
		expect(typeof postObj.blogName).toBe('string')
		expect(postObj.createdAt).toMatch(
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
		)
		expect(typeof postObj.extendedLikesInfo).toBe('object')
		expect(postObj.extendedLikesInfo.likesCount).toBe(likesCount)
		expect(postObj.extendedLikesInfo.dislikesCount).toBe(dislikesCount)
		expect(postObj.extendedLikesInfo.myStatus).toBe(currentUserLikeStatus)
		expect(typeof postObj.extendedLikesInfo).toBe('object')
		expect({}.toString.call(postObj.extendedLikesInfo.newestLikes)).toBe('[object Array]')

		if (postObj.extendedLikesInfo.newestLikes.length) {
			expect(postObj.extendedLikesInfo.newestLikes[0].addedAt).toMatch(
				/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
			)
			expect(typeof postObj.extendedLikesInfo.newestLikes[0].userId).toBe('string')
			expect(typeof postObj.extendedLikesInfo.newestLikes[0].login).toBe('string')
		}
	},
	async setPostLikeStatus(
		app: INestApplication,
		postId: string,
		userToken: string,
		likeStatus: LikeStatuses,
	) {
		await request(app.getHttpServer())
			.put('/' + RouteNames.POSTS.POST_ID(postId).LIKE_STATUS.full)
			.set('authorization', 'Bearer ' + userToken)
			.send(JSON.stringify({ likeStatus }))
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.expect(HTTP_STATUSES.NO_CONTENT_204)
	},
	async addPostCommentRequest(
		app: INestApplication,
		userAuthorizationToken: string,
		postId: string,
		commentDto: Partial<CreatePostCommentDtoModel> = {},
	) {
		return request(app.getHttpServer())
			.post('/' + RouteNames.POSTS.POST_ID(postId).COMMENTS.full())
			.send(this.createDtoAddPostComment(commentDto))
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.set('authorization', 'Bearer ' + userAuthorizationToken)
	},
	createDtoAddPostComment(
		newCommentObj: Partial<CreatePostCommentDtoModel> = {},
	): CreatePostCommentDtoModel {
		return Object.assign(
			{
				content: 'new content min 20 characters',
			},
			newCommentObj,
		)
	},
}
