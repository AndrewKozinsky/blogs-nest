import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { describe } from 'node:test'
import { UpdateBlogPostDtoModel } from '../src/features/blogs/saBlogs/model/blogs.input.model'
import { HTTP_STATUSES } from '../src/settings/config'
import RouteNames from '../src/settings/routeNames'
import { DBTypes } from '../src/db/mongo/dbTypes'
import { CreateBlogDtoModel } from '../src/features/blogs/blogs/model/blogs.input.model'
import { GetBlogsOutModel } from '../src/features/blogs/blogs/model/blogs.output.model'
import { GetPostsOutModel } from '../src/features/blogs/posts/model/posts.output.model'
import { createTestApp } from './utils/common'
import { clearAllDB } from './utils/db'
import {
	addBlogPostRequest,
	addBlogRequest,
	addPostRequest,
	adminAuthorizationValue,
	checkPostObj,
	createDtoAddBlogPost,
} from './utils/utils'

it.only('123', async () => {
	expect(2).toBe(2)
})

describe('ROOT', () => {
	let app: INestApplication

	beforeAll(async () => {
		app = await createTestApp()
	})

	beforeEach(async () => {
		await clearAllDB(app)
	})

	describe('Getting all blogs', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return an object with property items contains an empty array', async () => {
			const successAnswer: GetBlogsOutModel = {
				pagesCount: 0,
				page: 1,
				pageSize: 10,
				totalCount: 0,
				items: [],
			}

			await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200, successAnswer)
		})

		it('should return an object with property items contains array with 2 items after creating 2 blogs', async () => {
			await addBlogRequest(app)
			await addBlogRequest(app)

			const getBlogsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.value)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.OK_200)

			expect(getBlogsRes.body.pagesCount).toBe(1)
			expect(getBlogsRes.body.page).toBe(1)
			expect(getBlogsRes.body.pageSize).toBe(10)
			expect(getBlogsRes.body.totalCount).toBe(2)
			expect(getBlogsRes.body.items.length).toBe(2)

			checkBlogObj(getBlogsRes.body.items[0])
			checkBlogObj(getBlogsRes.body.items[1])
		})

		it('should return an object with properties with specific values after creating 7 blogs', async () => {
			await addBlogRequest(app)
			await addBlogRequest(app)
			await addBlogRequest(app)
			await addBlogRequest(app)
			await addBlogRequest(app)
			await addBlogRequest(app)
			await addBlogRequest(app)

			const getBlogsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.value + '?pageNumber=2&pageSize=2')
				.set('authorization', adminAuthorizationValue)

			expect(getBlogsRes.body.page).toBe(2)
			expect(getBlogsRes.body.pagesCount).toBe(4)
			expect(getBlogsRes.body.totalCount).toBe(7)
			expect(getBlogsRes.body.items.length).toBe(2)
		})

		it('should return blogs with name contains "this" after creating 7 blogs', async () => {
			await addBlogRequest(app, { name: '1 this' })
			await addBlogRequest(app, { name: '2' })
			await addBlogRequest(app, { name: '3 this' })
			await addBlogRequest(app, { name: '4' })
			await addBlogRequest(app, { name: '5 this' })
			await addBlogRequest(app, { name: '6 this' })
			await addBlogRequest(app, { name: 'this' })

			const getBlogsRes = await request(app.getHttpServer())
				.get(
					'/' +
						RouteNames.SA_BLOGS.value +
						'?pageNumber=2&pageSize=2&searchNameTerm=this',
				)
				.set('authorization', adminAuthorizationValue)

			expect(getBlogsRes.body.page).toBe(2)
			expect(getBlogsRes.body.pagesCount).toBe(3)
			expect(getBlogsRes.body.totalCount).toBe(5)
			expect(getBlogsRes.body.items.length).toBe(2)
		})

		it('should return blogs sorted by name and asc and desc order', async () => {
			await addBlogRequest(app, { name: '3' })
			await addBlogRequest(app, { name: '5' })
			await addBlogRequest(app, { name: '1' })
			await addBlogRequest(app, { name: '12' })
			await addBlogRequest(app, { name: '4' })

			// Get blogs sorted by createdat field (by default)
			const getBlogsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.value)
				.set('authorization', adminAuthorizationValue)

			const blogs = getBlogsRes.body.items
			expect(blogs[0].name).toBe('4')
			expect(blogs[1].name).toBe('12')
			expect(blogs[2].name).toBe('1')
			expect(blogs[3].name).toBe('5')
			expect(blogs[4].name).toBe('3')

			// Get blogs sorted by name field with asc order
			const getBlogsAscRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.value + '?sortDirection=asc&sortBy=name')
				.set('authorization', adminAuthorizationValue)

			const blogsAsc = getBlogsAscRes.body.items
			expect(blogsAsc[0].name).toBe('1')
			expect(blogsAsc[1].name).toBe('12')
			expect(blogsAsc[2].name).toBe('3')
			expect(blogsAsc[3].name).toBe('4')
			expect(blogsAsc[4].name).toBe('5')

			// Get blogs sorted by name field with desc order
			const getBlogsDescRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.value + '?sortDirection=desc&sortBy=name')
				.set('authorization', adminAuthorizationValue)

			const blogsDesc = getBlogsDescRes.body.items
			expect(blogsDesc[0].name).toBe('5')
			expect(blogsDesc[1].name).toBe('4')
			expect(blogsDesc[2].name).toBe('3')
			expect(blogsDesc[3].name).toBe('12')
			expect(blogsDesc[4].name).toBe('1')
		})
	})

	describe('Creating a blog', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.SA_BLOGS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not create a blog by wrong dto', async () => {
			const createdBlogRes = await addBlogRequest(app, {
				websiteUrl: 'samurai.it-incubator',
			})

			expect(createdBlogRes.status).toBe(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(createdBlogRes.body.errorsMessages)).toBe('[object Array]')
			expect(createdBlogRes.body.errorsMessages.length).toBe(1)
			expect(createdBlogRes.body.errorsMessages[0].field).toBe('websiteUrl')
		})

		it('should create a blog by correct dto', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)

			checkBlogObj(createdBlogRes.body)

			// Check if there are 2 blogs after adding another one
			const createdSecondBlogRes = await addBlogRequest(app)
			expect(createdSecondBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const allBlogsRes = await request(app.getHttpServer()).get('/' + RouteNames.BLOGS.value)
			expect(allBlogsRes.body.items.length).toBe(2)
		})
	})

	describe('Getting a blog', () => {
		it("should return a 404 if a blog doesn't exists", async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').full)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return an existing blog', async () => {
			const createdBlogRes = await addBlogRequest(app)
			const createdBlogId = createdBlogRes.body.id

			const getBlogRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.SA_BLOGS.SA_BLOG_ID(createdBlogId).full,
			)
			expect(getBlogRes.status).toBe(HTTP_STATUSES.OK_200)
			checkBlogObj(getBlogRes.body)
		})
	})

	describe('Getting a blog posts', () => {
		it("should return a 404 if a blog doesn't exists", async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').POSTS.full)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return an object with property items contains an empty array', async () => {
			const createdBlogRes = await addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const successAnswer: GetPostsOutModel = {
				pagesCount: 0,
				page: 1,
				pageSize: 10,
				totalCount: 0,
				items: [],
			}

			await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.SA_BLOG_ID(blogId).POSTS.full)
				.expect(HTTP_STATUSES.OK_200, successAnswer)
		})

		it('should return an object with property items contains array with 2 items after creating 2 blog posts', async () => {
			const createdBlogRes = await addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			await addBlogPostRequest(app, blogId)
			await addBlogPostRequest(app, blogId)

			const getBlogPostsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.SA_BLOG_ID(blogId).POSTS.full)
				.expect(HTTP_STATUSES.OK_200)

			expect(getBlogPostsRes.body.pagesCount).toBe(1)
			expect(getBlogPostsRes.body.page).toBe(1)
			expect(getBlogPostsRes.body.pageSize).toBe(10)
			expect(getBlogPostsRes.body.totalCount).toBe(2)
			expect(getBlogPostsRes.body.items.length).toBe(2)

			checkPostObj(getBlogPostsRes.body.items[0], 0, 0, DBTypes.LikeStatuses.None)
			checkPostObj(getBlogPostsRes.body.items[1], 0, 0, DBTypes.LikeStatuses.None)
		})

		it('should return an object with properties with specific values after creating 5 blog posts', async () => {
			const createdBlogRes = await addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			await addBlogPostRequest(app, blogId)
			await addBlogPostRequest(app, blogId)
			await addBlogPostRequest(app, blogId)
			await addBlogPostRequest(app, blogId)
			await addBlogPostRequest(app, blogId)
			await addBlogPostRequest(app, blogId)
			await addBlogPostRequest(app, blogId)

			const getBlogsRes = await request(app.getHttpServer()).get(
				'/' +
					RouteNames.SA_BLOGS.SA_BLOG_ID(blogId).POSTS.full +
					'?pageNumber=2&pageSize=2',
			)

			expect(getBlogsRes.body.page).toBe(2)
			expect(getBlogsRes.body.pagesCount).toBe(4)
			expect(getBlogsRes.body.totalCount).toBe(7)
			expect(getBlogsRes.body.items.length).toBe(2)
		})
	})

	describe('Updating a blog', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not update a non existing blog', async () => {
			const updateBlogDto: CreateBlogDtoModel = {
				name: 'my UPDATED name',
				description: 'my UPDATED description',
				websiteUrl:
					'https://9DKoTEgTwRIyvI8-tVDUU2STaq3OG.e0d6f1EB3XsujFbOW53q5woGXMrAc5zXUnQxWvxsTS6a3zLYZdUWDt-',
			}

			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').full)
				.send(updateBlogDto)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should not update a blog by wrong dto', async () => {
			const createdBlogRes = await addBlogRequest(app)
			const createdBlogId = createdBlogRes.body.id

			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_BLOGS.SA_BLOG_ID(createdBlogId).full)
				.send({})
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should update a blog by correct dto', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdBlogId = createdBlogRes.body.id

			const updateBlogDto: CreateBlogDtoModel = {
				name: 'my UPDATED name',
				description: 'my UPDATED description',
				websiteUrl:
					'https://9DKoTEgTwRIyvI8-tVDUU2STaq3OG.e0d6f1EB3XsujFbOW53q5woGXMrAc5zXUnQxWvxsTS6a3zLYZdUWDt-',
			}

			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_BLOGS.SA_BLOG_ID(createdBlogId).full)
				.send(updateBlogDto)
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			const getBlogRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.BLOGS.BLOG_ID(createdBlogId).full,
			)

			expect(getBlogRes.status).toBe(HTTP_STATUSES.OK_200)
			expect(getBlogRes.body.name).toBe(updateBlogDto.name)
			expect(getBlogRes.body.description).toBe(updateBlogDto.description)
			expect(getBlogRes.body.websiteUrl).toBe(updateBlogDto.websiteUrl)
		})
	})

	describe('Create a blog post', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').POSTS.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('forbid to create a blog post by wrong blog id', async () => {
			const addBlogPostDto = createDtoAddBlogPost()

			return await request(app.getHttpServer())
				.post('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').POSTS.full)
				.send(addBlogPostDto)
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('create a blog post by wrong dto', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const addBlogPostRes = await addBlogPostRequest(app, createdBlogRes.body.id, {
				title: '',
			})

			expect({}.toString.call(addBlogPostRes.body.errorsMessages)).toBe('[object Array]')
			expect(addBlogPostRes.body.errorsMessages.length).toBe(1)
			expect(addBlogPostRes.body.errorsMessages[0].field).toBe('title')
		})

		it('should create a blog post by correct dto', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const createBlogPostRes = await addBlogPostRequest(app, createdBlogRes.body.id)

			checkPostObj(createBlogPostRes.body, 0, 0, DBTypes.LikeStatuses.None)

			// Check if there are 2 blog posts after adding another one
			const createdSecondBlogPostRes = await addBlogPostRequest(app, createdBlogRes.body.id)
			expect(createdSecondBlogPostRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const allBlogPostsRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.SA_BLOGS.SA_BLOG_ID(createdBlogRes.body.id).POSTS.full,
			)
			expect(allBlogPostsRes.body.items.length).toBe(2)
		})
	})

	describe('Deleting a blog', () => {
		it('should forbid a request from an unauthorized user', async () => {
			request(app.getHttpServer())
				.delete('/' + RouteNames.SA_BLOGS.value)
				.expect(HTTP_STATUSES.FORBIDDEN_403)
		})

		it('should not delete a non existing blog', async () => {
			await request(app.getHttpServer())
				.delete('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should delete a blog', async () => {
			const createdBlogRes = await addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdBlogId = createdBlogRes.body.id

			await request(app.getHttpServer())
				.delete('/' + RouteNames.SA_BLOGS.SA_BLOG_ID(createdBlogId).full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			await request(app.getHttpServer())
				.get('/' + RouteNames.SA_BLOGS.SA_BLOG_ID(createdBlogId).full)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})
	})

	describe('Updating a blog post', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').POST_ID('999').full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not update a non existing post', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').POST_ID('999').full)
				.send({ title: 'title', shortDescription: 'shortDescription', content: 'content' })
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should not update a post by wrong dto', async () => {
			const createdBlogRes = await addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await addPostRequest(app, blogId)
			const createdPostId = createdPostRes.body.id

			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_BLOGS.SA_BLOG_ID(blogId).POST_ID(createdPostId).full)
				.send({})
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should update a post by correct dto', async () => {
			const createdBlogRes = await addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdPostId = createdPostRes.body.id

			const updatePostDto: UpdateBlogPostDtoModel = {
				title: 'UPDATED title',
				shortDescription: 'UPDATED shortDescription',
				content: 'UPDATED content',
			}

			await request(app.getHttpServer())
				.put('/' + RouteNames.SA_BLOGS.SA_BLOG_ID(blogId).POST_ID(createdPostId).full)
				.send(updatePostDto)
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			const getPostRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.POSTS.POST_ID(createdPostId).full,
			)

			expect(getPostRes.status).toBe(HTTP_STATUSES.OK_200)
			expect(getPostRes.body.title).toBe(updatePostDto.title)
			expect(getPostRes.body.shortDescription).toBe(updatePostDto.shortDescription)
			expect(getPostRes.body.content).toBe(updatePostDto.content)
		})
	})

	describe('Deleting a blog post', () => {
		it('should forbid a request from an unauthorized user', async () => {
			request(app.getHttpServer())
				.delete('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').POST_ID('999').full)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should not delete a non existing post', async () => {
			await request(app.getHttpServer())
				.delete('/' + RouteNames.SA_BLOGS.SA_BLOG_ID('999').POST_ID('999').full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should delete a post', async () => {
			const createdBlogRes = await addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdPostId = createdPostRes.body.id

			await request(app.getHttpServer())
				.delete('/' + RouteNames.SA_BLOGS.SA_BLOG_ID(blogId).POST_ID(createdPostId).full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(createdPostId).full)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})
	})
})

function checkBlogObj(blogObj: any) {
	expect(typeof blogObj._id).toBe('undefined')
	expect(typeof blogObj.id).toBe('string')
	expect(typeof blogObj.name).toBe('string')
	expect(typeof blogObj.description).toBe('string')
	expect(blogObj.createdAt).toMatch(
		/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
	)
	expect(typeof blogObj.websiteUrl).toBe('string')
	expect(blogObj.isMembership).toBe(false)
}
