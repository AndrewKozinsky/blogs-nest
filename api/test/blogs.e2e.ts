import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { describe } from 'node:test'
import { LikeStatuses } from '../src/db/pg/entities/postLikes'
import { CreateBlogDtoModel } from '../src/models/blogs/blogs.input.model'
import { GetBlogsOutModel } from '../src/models/blogs/blogs.output.model'
import { HTTP_STATUSES } from '../src/settings/config'
import RouteNames from '../src/settings/routeNames'
import { GetPostsOutModel } from '../src/models/posts/posts.output.model'
import { blogUtils } from './utils/blogUtils'
import { adminAuthorizationValue, createTestApp } from './utils/common'
import { clearAllDB } from './utils/db'
import { postUtils } from './utils/postUtils'
import { userUtils } from './utils/userUtils'

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
		it('should return an object with property items contains an empty array', async () => {
			const successAnswer: GetBlogsOutModel = {
				pagesCount: 0,
				page: 1,
				pageSize: 10,
				totalCount: 0,
				items: [],
			}

			await request(app.getHttpServer())
				.get('/' + RouteNames.BLOGS.value)
				.expect(HTTP_STATUSES.OK_200, successAnswer)
		})

		it('should return an object with property items contains array with 2 items after creating 2 blogs', async () => {
			await blogUtils.addBlogRequest(app)
			await blogUtils.addBlogRequest(app)

			const getBlogsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.BLOGS.value)
				.expect(HTTP_STATUSES.OK_200)

			expect(getBlogsRes.body.pagesCount).toBe(1)
			expect(getBlogsRes.body.page).toBe(1)
			expect(getBlogsRes.body.pageSize).toBe(10)
			expect(getBlogsRes.body.totalCount).toBe(2)
			expect(getBlogsRes.body.items.length).toBe(2)

			blogUtils.checkBlogObj(getBlogsRes.body.items[0])
			blogUtils.checkBlogObj(getBlogsRes.body.items[1])
		})

		it('should return an object with properties with specific values after creating 5 blogs', async () => {
			await blogUtils.addBlogRequest(app)
			await blogUtils.addBlogRequest(app)
			await blogUtils.addBlogRequest(app)
			await blogUtils.addBlogRequest(app)
			await blogUtils.addBlogRequest(app)
			await blogUtils.addBlogRequest(app)
			await blogUtils.addBlogRequest(app)

			const getBlogsRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.BLOGS.value + '?pageNumber=2&pageSize=2',
			)

			expect(getBlogsRes.body.page).toBe(2)
			expect(getBlogsRes.body.pagesCount).toBe(4)
			expect(getBlogsRes.body.totalCount).toBe(7)
			expect(getBlogsRes.body.items.length).toBe(2)
		})
	})

	describe('Creating a blog', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.BLOGS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not create a blog by wrong dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app, {
				websiteUrl: 'samurai.it-incubator',
			})

			expect(createdBlogRes.status).toBe(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(createdBlogRes.body.errorsMessages)).toBe('[object Array]')
			expect(createdBlogRes.body.errorsMessages.length).toBe(1)
			expect(createdBlogRes.body.errorsMessages[0].field).toBe('websiteUrl')
		})

		it('should create a blog by correct dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)

			blogUtils.checkBlogObj(createdBlogRes.body)

			// Check if there are 2 blogs after adding another one
			const createdSecondBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdSecondBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const allBlogsRes = await request(app.getHttpServer()).get('/' + RouteNames.BLOGS.value)
			expect(allBlogsRes.body.items.length).toBe(2)
		})
	})

	describe('Getting a blog', () => {
		it("should return a 404 if a blog doesn't exists", async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.BLOGS.BLOG_ID('999').full)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return an existing blog', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const createdBlogId = createdBlogRes.body.id

			const getBlogRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.BLOGS.BLOG_ID(createdBlogId).full,
			)
			expect(getBlogRes.status).toBe(HTTP_STATUSES.OK_200)
			blogUtils.checkBlogObj(getBlogRes.body)
		})
	})

	describe('Getting a blog posts', () => {
		it("should return a 404 if a blog posts doesn't exists", async () => {
			await request(app.getHttpServer())
				.get('/' + RouteNames.BLOGS.BLOG_ID('999').POSTS.full)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return an object with property items contains an empty array', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const successAnswer: GetPostsOutModel = {
				pagesCount: 0,
				page: 1,
				pageSize: 10,
				totalCount: 0,
				items: [],
			}

			await request(app.getHttpServer())
				.get('/' + RouteNames.BLOGS.BLOG_ID(blogId).POSTS.full)
				.expect(HTTP_STATUSES.OK_200, successAnswer)
		})

		it('should return an object with property items contains array with 2 items after creating 2 blog posts', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			await blogUtils.addBlogPostRequest(app, blogId)
			await blogUtils.addBlogPostRequest(app, blogId)

			const getBlogPostsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.BLOGS.BLOG_ID(blogId).POSTS.full)
				.expect(HTTP_STATUSES.OK_200)

			expect(getBlogPostsRes.body.pagesCount).toBe(1)
			expect(getBlogPostsRes.body.page).toBe(1)
			expect(getBlogPostsRes.body.pageSize).toBe(10)
			expect(getBlogPostsRes.body.totalCount).toBe(2)
			expect(getBlogPostsRes.body.items.length).toBe(2)

			postUtils.checkPostObj(getBlogPostsRes.body.items[0], 0, 0, LikeStatuses.None)
			postUtils.checkPostObj(getBlogPostsRes.body.items[1], 0, 0, LikeStatuses.None)
		})

		it('should return an object with properties with specific values after creating 7 blog posts', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			for (let i = 0; i < 7; i++) {
				await blogUtils.addBlogPostRequest(app, blogId, { title: 'title ' + i })
			}

			// Get blogs with default (ASC) sorting
			const getBlogsRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.BLOGS.BLOG_ID(blogId).POSTS.full + '?pageNumber=2&pageSize=2',
			)

			expect(getBlogsRes.body.page).toBe(2)
			expect(getBlogsRes.body.pagesCount).toBe(4)
			expect(getBlogsRes.body.totalCount).toBe(7)
			expect(getBlogsRes.body.items.length).toBe(2)
			const blogItems = getBlogsRes.body.items

			expect(blogItems[0].title).toBe('title 4')
			expect(blogItems[1].title).toBe('title 3')
		})

		it('should return array of blog posts appropriated CreatedAd ASC or DSC sorting', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			for (let i = 0; i < 7; i++) {
				await blogUtils.addBlogPostRequest(app, blogId, { title: 'title ' + i })
			}

			// Get blogs with default (DESC) sorting
			const getBlogsDESCRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.BLOGS.BLOG_ID(blogId).POSTS.full + '?',
			)

			expect(getBlogsDESCRes.body.items.length).toBe(7)
			const blogDESCItems = getBlogsDESCRes.body.items

			for (let i = 0; i < 7; i++) {
				expect(blogDESCItems[i].title).toBe('title ' + +(6 - i))
			}

			// Get blogs with ASC sorting
			const getBlogsASCRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.BLOGS.BLOG_ID(blogId).POSTS.full + '?sortDirection=asc',
			)

			const getBlogsASCResItems = getBlogsASCRes.body.items

			for (let i = 0; i < 7; i++) {
				expect(getBlogsASCResItems[i].title).toBe('title ' + i)
			}
		})

		it('should return array of blog posts sorted by title field', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			await Promise.all([
				blogUtils.addBlogPostRequest(app, blogId, { title: '3' }),
				blogUtils.addBlogPostRequest(app, blogId, { title: '2' }),
				blogUtils.addBlogPostRequest(app, blogId, { title: '4' }),
				blogUtils.addBlogPostRequest(app, blogId, { title: '1' }),
			])

			const getASCBlogPostsRes = await request(app.getHttpServer()).get(
				'/' +
					RouteNames.BLOGS.BLOG_ID(blogId).POSTS.full +
					'?sortDirection=asc&sortBy=title',
			)
			const blogsPostsASC = getASCBlogPostsRes.body.items

			expect(blogsPostsASC[0].title).toBe('1')
			expect(blogsPostsASC[1].title).toBe('2')
			expect(blogsPostsASC[2].title).toBe('3')
			expect(blogsPostsASC[3].title).toBe('4')

			const getDESCBlogPostsRes = await request(app.getHttpServer()).get(
				'/' +
					RouteNames.BLOGS.BLOG_ID(blogId).POSTS.full +
					'?sortDirection=desc&sortBy=title',
			)
			const blogsPostsDESC = getDESCBlogPostsRes.body.items

			expect(blogsPostsDESC[0].title).toBe('4')
			expect(blogsPostsDESC[1].title).toBe('3')
			expect(blogsPostsDESC[2].title).toBe('2')
			expect(blogsPostsDESC[3].title).toBe('1')
		})

		it('create 6 posts then: like post 1 by user 1, user 2; like post 2 by user 2, user 3; dislike post 3 by user 1; like post 4 by user 1, user 4, user 2, user 3; like post 5 by user 2, dislike by user 3; like post 6 by user 1, dislike by user 2. Get the posts by user 1 after all likes NewestLikes should be sorted in descending', async () => {
			// Create a blog
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			// Create posts
			const createdPost1Res = await postUtils.addPostRequest(app, blogId, { title: 'post-1' })
			const createdPost2Res = await postUtils.addPostRequest(app, blogId, { title: 'post-2' })
			const createdPost3Res = await postUtils.addPostRequest(app, blogId, { title: 'post-3' })
			const createdPost4Res = await postUtils.addPostRequest(app, blogId, { title: 'post-4' })
			const createdPost5Res = await postUtils.addPostRequest(app, blogId, { title: 'post-5' })
			const createdPost6Res = await postUtils.addPostRequest(app, blogId, { title: 'post-6' })
			const postId1 = createdPost1Res.body.id
			const postId2 = createdPost2Res.body.id
			const postId3 = createdPost3Res.body.id
			const postId4 = createdPost4Res.body.id
			const postId5 = createdPost5Res.body.id
			const postId6 = createdPost6Res.body.id

			// Users and their tokens
			let user1Token = ''
			let user2Token = ''
			let user3Token = ''
			let user4Token = ''

			for (let i = 1; i <= 4; i++) {
				const login = 'login-' + i
				const password = 'password-' + i
				const email = `email-${i}@mail.com`

				const createdUserRes = await userUtils.createUniqueUser(app, {
					login,
					password,
					email,
				})
				expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
				const loginUserRes = await userUtils.loginUser(app, email, password)
				const token = loginUserRes.body.accessToken

				if (i == 1) {
					user1Token = token
				} else if (i == 2) {
					user2Token = token
				} else if (i == 3) {
					user3Token = token
				} else if (i == 4) {
					user4Token = token
				}
			}

			async function setLikeStatus(
				userToken: string,
				postId: string,
				likeStatus: LikeStatuses,
			) {
				await request(app.getHttpServer())
					.put('/' + RouteNames.POSTS.POST_ID(postId).LIKE_STATUS.full)
					.set('authorization', 'Bearer ' + userToken)
					.send(JSON.stringify({ likeStatus }))
					.set('Content-Type', 'application/json')
					.set('Accept', 'application/json')
					.expect(HTTP_STATUSES.NO_CONTENT_204)
			}

			// Set a like statuses to the posts
			await setLikeStatus(user1Token, postId1, LikeStatuses.Like)
			await setLikeStatus(user2Token, postId1, LikeStatuses.Like)
			await setLikeStatus(user2Token, postId2, LikeStatuses.Like)
			await setLikeStatus(user3Token, postId2, LikeStatuses.Like)
			await setLikeStatus(user1Token, postId3, LikeStatuses.Dislike)
			await setLikeStatus(user1Token, postId4, LikeStatuses.Like)
			await setLikeStatus(user4Token, postId4, LikeStatuses.Like)
			await setLikeStatus(user2Token, postId4, LikeStatuses.Like)
			await setLikeStatus(user3Token, postId4, LikeStatuses.Like)
			await setLikeStatus(user2Token, postId5, LikeStatuses.Like)
			await setLikeStatus(user3Token, postId5, LikeStatuses.Dislike)
			await setLikeStatus(user1Token, postId6, LikeStatuses.Like)

			// Get the posts by user 1 after all likes NewestLikes should be sorted in descending
			const getPostsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.BLOGS.BLOG_ID(blogId).POSTS.full + '?sortDirection=asc')
				.set('authorization', 'Bearer ' + user1Token)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.OK_200)

			expect(getPostsRes.body.totalCount).toBe(6)
			const postDescItems = getPostsRes.body.items

			expect(postDescItems.length).toBe(6)
			expect(postDescItems[0].title).toBe('post-1')
			expect(postDescItems[1].title).toBe('post-2')
			expect(postDescItems[2].title).toBe('post-3')
			expect(postDescItems[3].title).toBe('post-4')
			expect(postDescItems[4].title).toBe('post-5')
			expect(postDescItems[5].title).toBe('post-6')

			expect(postDescItems[0].extendedLikesInfo.myStatus).toBe(LikeStatuses.Like)
			expect(postDescItems[2].extendedLikesInfo.myStatus).toBe(LikeStatuses.Dislike)
			expect(postDescItems[3].extendedLikesInfo.myStatus).toBe(LikeStatuses.Like)
			expect(postDescItems[5].extendedLikesInfo.myStatus).toBe(LikeStatuses.Like)
		})
	})

	describe('Updating a blog', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.BLOGS.BLOG_ID('999').full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not update a non existing blog', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.BLOGS.BLOG_ID('999').full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should not update a blog by wrong dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const createdBlogId = createdBlogRes.body.id

			await request(app.getHttpServer())
				.put('/' + RouteNames.BLOGS.BLOG_ID(createdBlogId).full)
				.send({})
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should update a blog by correct dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdBlogId = createdBlogRes.body.id

			const updateBlogDto: CreateBlogDtoModel = {
				name: 'my UPDATED name',
				description: 'my UPDATED description',
				websiteUrl:
					'https://9DKoTEgTwRIyvI8-tVDUU2STaq3OG.e0d6f1EB3XsujFbOW53q5woGXMrAc5zXUnQxWvxsTS6a3zLYZdUWDt-',
			}

			await request(app.getHttpServer())
				.put('/' + RouteNames.BLOGS.BLOG_ID(createdBlogId).full)
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
				.post('/' + RouteNames.BLOGS.BLOG_ID('999').POSTS.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('forbid to create a blog post by wrong blog id', async () => {
			const addBlogPostDto = blogUtils.createDtoAddBlogPost()

			return await request(app.getHttpServer())
				.post('/' + RouteNames.BLOGS.BLOG_ID('999').POSTS.full)
				.send(addBlogPostDto)
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('create a blog post by wrong dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const addBlogPostRes = await blogUtils.addBlogPostRequest(app, createdBlogRes.body.id, {
				title: '',
			})

			expect({}.toString.call(addBlogPostRes.body.errorsMessages)).toBe('[object Array]')
			expect(addBlogPostRes.body.errorsMessages.length).toBe(1)
			expect(addBlogPostRes.body.errorsMessages[0].field).toBe('title')
		})

		it('should create a blog post by correct dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const createBlogPostRes = await blogUtils.addBlogPostRequest(
				app,
				createdBlogRes.body.id,
			)

			postUtils.checkPostObj(createBlogPostRes.body, 0, 0, LikeStatuses.None)

			// Check if there are 2 blog posts after adding another one
			const createdSecondBlogPostRes = await blogUtils.addBlogPostRequest(
				app,
				createdBlogRes.body.id,
			)
			expect(createdSecondBlogPostRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const allBlogPostsRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.BLOGS.BLOG_ID(createdBlogRes.body.id).POSTS.full,
			)
			expect(allBlogPostsRes.body.items.length).toBe(2)
		})
	})

	describe('Deleting a blog', () => {
		it('should forbid a request from an unauthorized user', async () => {
			return request(app.getHttpServer()).delete('/' + RouteNames.BLOGS.value)
		})

		it('should not delete a non existing blog', async () => {
			await request(app.getHttpServer())
				.delete('/' + RouteNames.BLOGS.BLOG_ID('999').full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should delete a blog', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdBlogId = createdBlogRes.body.id

			await request(app.getHttpServer())
				.delete('/' + RouteNames.BLOGS.BLOG_ID(createdBlogId).full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			await request(app.getHttpServer())
				.get('/' + RouteNames.BLOGS.BLOG_ID(createdBlogId).full)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})
	})
})
