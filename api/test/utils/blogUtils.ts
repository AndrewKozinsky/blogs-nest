import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import {
	CreateBlogDtoModel,
	CreateBlogPostDtoModel,
} from '../../src/models/blogs/blogs.input.model'
import RouteNames from '../../src/settings/routeNames'
import { adminAuthorizationValue } from './common'

export const blogUtils = {
	createDtoAddBlog(newBlogObj: Partial<CreateBlogDtoModel> = {}): CreateBlogDtoModel {
		return Object.assign(
			{
				name: 'my name',
				description: 'my description',
				websiteUrl:
					'https://9DKoTEgTwRIyvI8-tVDUU2STaq3OG.e0d6f1EB3XsujFbOW53q5woGXMrAc5zXUnQxWvxsTS6a3zLYZdUWDt-BnXLEs1',
			},
			{ ...newBlogObj },
		)
	},
	async addBlogRequest(app: INestApplication, blogDto: Partial<CreateBlogDtoModel> = {}) {
		return request(app.getHttpServer())
			.post('/' + RouteNames.BLOGS.value)
			.send(this.createDtoAddBlog(blogDto))
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.set('authorization', adminAuthorizationValue)
	},
	async addBlogPostRequest(
		app: INestApplication,
		blogId: string,
		postDto: Partial<CreateBlogPostDtoModel> = {},
	) {
		const addBlogPostDto = this.createDtoAddBlogPost(postDto)

		return await request(app.getHttpServer())
			.post('/' + RouteNames.BLOGS.BLOG_ID(blogId).POSTS.full)
			.send(addBlogPostDto)
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.set('authorization', adminAuthorizationValue)
	},
	createDtoAddBlogPost(newPostObj: Partial<CreateBlogPostDtoModel> = {}): CreateBlogPostDtoModel {
		return Object.assign(
			{
				title: 'title',
				shortDescription: 'shortDescription',
				content: 'content',
			},
			newPostObj,
		)
	},
	checkBlogObj(blogObj: any) {
		expect(typeof blogObj._id).toBe('undefined')
		expect(typeof blogObj.id).toBe('string')
		expect(typeof blogObj.name).toBe('string')
		expect(typeof blogObj.description).toBe('string')
		expect(blogObj.createdAt).toMatch(
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
		)
		expect(typeof blogObj.websiteUrl).toBe('string')
		expect(blogObj.isMembership).toBe(false)
	},
}
