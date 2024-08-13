import { INestApplication } from '@nestjs/common'
import { agent as request } from 'supertest'
import { CreatePostDtoModel } from '../src/features/blogs/posts/model/posts.input.model'
import { GetPostsOutModel } from '../src/features/blogs/posts/model/posts.output.model'
import { HTTP_STATUSES } from '../src/settings/config'
import RouteNames from '../src/settings/routeNames'
import { DBTypes } from '../src/db/mongo/dbTypes'
import { GetPostCommentsOutModel } from '../src/features/blogs/comments/model/comments.output.model'
import { blogUtils } from './utils/blogUtils'
import { commentUtils } from './utils/commentUtils'
import { adminAuthorizationValue, createTestApp, userEmail, userPassword } from './utils/common'
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

	describe('Getting post comments', () => {
		it('should return an object with property items contains an empty array', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			const successAnswer: GetPostCommentsOutModel = {
				pagesCount: 0,
				page: 1,
				pageSize: 10,
				totalCount: 0,
				items: [],
			}

			const postRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(postId).COMMENTS.full())
				.expect(HTTP_STATUSES.OK_200, successAnswer)
		})

		it('should return an object with property items contains array with 2 items after creating 2 comments', async () => {
			// Create a blog
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			// Create a post
			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// User on whose behalf comments will be created
			const [userAccessToken, userId, userLogin] =
				await userUtils.createUniqueUserAndLogin(app)

			await postUtils.addPostCommentRequest(app, userAccessToken, postId)
			await postUtils.addPostCommentRequest(app, userAccessToken, postId)

			const getPostCommentsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(postId).COMMENTS.full())
				.expect(HTTP_STATUSES.OK_200)

			expect(getPostCommentsRes.body).toMatchObject({
				pagesCount: 1,
				page: 1,
				pageSize: 10,
				totalCount: 2,
				items: expect.any(Array),
			})

			commentUtils.checkCommentObj(
				getPostCommentsRes.body.items[0],
				userId,
				userLogin,
				0,
				0,
				DBTypes.LikeStatuses.None,
			)
			commentUtils.checkCommentObj(
				getPostCommentsRes.body.items[1],
				userId,
				userLogin,
				0,
				0,
				DBTypes.LikeStatuses.None,
			)
		})

		it('should return an array of objects matching the queries scheme', async () => {
			// Create a blog
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			// Create a post
			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			const [userAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			await postUtils.addPostCommentRequest(app, userAccessToken, postId)
			await postUtils.addPostCommentRequest(app, userAccessToken, postId)
			await postUtils.addPostCommentRequest(app, userAccessToken, postId)
			await postUtils.addPostCommentRequest(app, userAccessToken, postId)
			await postUtils.addPostCommentRequest(app, userAccessToken, postId)
			await postUtils.addPostCommentRequest(app, userAccessToken, postId)
			await postUtils.addPostCommentRequest(app, userAccessToken, postId)

			const getPostCommentsRes = await request(app.getHttpServer())
				.get(
					'/' +
						RouteNames.POSTS.POST_ID(postId).COMMENTS.full('?pageNumber=2&pageSize=2'),
				)
				.expect(HTTP_STATUSES.OK_200)

			expect(getPostCommentsRes.body).toMatchObject({
				pagesCount: 4,
				page: 2,
				pageSize: 2,
				totalCount: 7,
				items: expect.any(Array), //
			})

			expect(getPostCommentsRes.body.items.length).toBe(2)
		})

		it('create 6 comments then: like comment 1 by user 1, user 2; like comment 2 by user 2, user 3; dislike comment 3 by user 1; like comment 4 by user 1, user 4, user 2, user 3; like comment 5 by user 2, dislike by user 3; like comment 6 by user 1, dislike by user 2.', async () => {
			// Create a blog
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			// Create a post
			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// Users and their tokens
			let user1Token = ''
			let user1Id = ''
			let user1Login = ''
			let user2Token = ''
			let user2Id = ''
			let user3Token = ''
			let user3Id = ''
			let user4Token = ''
			let user4Id = ''

			for (let i = 1; i <= 4; i++) {
				const [userAccessToken, userId, userLogin] =
					await userUtils.createUniqueUserAndLogin(app)

				if (i == 1) {
					user1Token = userAccessToken
					user1Id = userId
					user1Login = userLogin
				} else if (i == 2) {
					user2Token = userAccessToken
					user2Id = userId
				} else if (i == 3) {
					user3Token = userAccessToken
					user3Id = userId
				} else if (i == 4) {
					user4Token = userAccessToken
					user4Id = userId
				}
			}

			// Create post comments
			const comment1Res = await postUtils.addPostCommentRequest(app, user1Token, postId, {
				content: 'new content min 20 characters 1',
			})
			const comment1Id = comment1Res.body.id
			const comment2Res = await postUtils.addPostCommentRequest(app, user1Token, postId, {
				content: 'new content min 20 characters 2',
			})
			const comment2Id = comment2Res.body.id
			const comment3Res = await postUtils.addPostCommentRequest(app, user1Token, postId, {
				content: 'new content min 20 characters 3',
			})
			const comment3Id = comment3Res.body.id
			const comment4Res = await postUtils.addPostCommentRequest(app, user1Token, postId, {
				content: 'new content min 20 characters 4',
			})
			const comment4Id = comment4Res.body.id
			const comment5Res = await postUtils.addPostCommentRequest(app, user1Token, postId, {
				content: 'new content min 20 characters 5',
			})
			const comment5Id = comment5Res.body.id
			const comment6Res = await postUtils.addPostCommentRequest(app, user1Token, postId, {
				content: 'new content min 20 characters 6',
			})
			const comment6Id = comment6Res.body.id

			async function setLikeStatus(
				userToken: string,
				commentId: string,
				likeStatus: DBTypes.LikeStatuses,
			) {
				await request(app.getHttpServer())
					.put('/' + RouteNames.COMMENTS.COMMENT_ID(commentId).LIKE_STATUS.full)
					.set('authorization', 'Bearer ' + userToken)
					.send(JSON.stringify({ likeStatus }))
					.set('Content-Type', 'application/json')
					.set('Accept', 'application/json')
					.expect(HTTP_STATUSES.NO_CONTENT_204)
			}

			// Set a like statuses to the comments
			await setLikeStatus(user1Token, comment1Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user2Token, comment1Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user2Token, comment2Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user3Token, comment2Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user1Token, comment3Id, DBTypes.LikeStatuses.Dislike)
			await setLikeStatus(user1Token, comment4Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user4Token, comment4Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user2Token, comment4Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user3Token, comment4Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user2Token, comment5Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user3Token, comment5Id, DBTypes.LikeStatuses.Dislike)
			await setLikeStatus(user1Token, comment6Id, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user2Token, comment6Id, DBTypes.LikeStatuses.Dislike)

			const getPostCommentsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(postId).COMMENTS.full('?sortDirection=asc'))
				.set('authorization', 'Bearer ' + user1Token)
				.expect(HTTP_STATUSES.OK_200)

			expect(getPostCommentsRes.body).toMatchObject({
				pagesCount: 1,
				page: 1,
				pageSize: 10,
				totalCount: 6,
				items: expect.any(Array),
			})

			commentUtils.checkCommentObj(
				getPostCommentsRes.body.items[0],
				user1Id,
				user1Login,
				2,
				0,
				DBTypes.LikeStatuses.Like,
			)
			commentUtils.checkCommentObj(
				getPostCommentsRes.body.items[1],
				user1Id,
				user1Login,
				2,
				0,
				DBTypes.LikeStatuses.None,
			)
			commentUtils.checkCommentObj(
				getPostCommentsRes.body.items[2],
				user1Id,
				user1Login,
				0,
				1,
				DBTypes.LikeStatuses.Dislike,
			)
			commentUtils.checkCommentObj(
				getPostCommentsRes.body.items[3],
				user1Id,
				user1Login,
				4,
				0,
				DBTypes.LikeStatuses.Like,
			)
			commentUtils.checkCommentObj(
				getPostCommentsRes.body.items[4],
				user1Id,
				user1Login,
				1,
				1,
				DBTypes.LikeStatuses.None,
			)
			commentUtils.checkCommentObj(
				getPostCommentsRes.body.items[5],
				user1Id,
				user1Login,
				1,
				1,
				DBTypes.LikeStatuses.Like,
			)
		})
	})

	describe('Creating a comment', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.POSTS.POST_ID('999').COMMENTS.full())
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not create a comment by wrong dto', async () => {
			// Create a blog
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			// Create a post
			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// User on whose behalf comments will be created
			const [userAccessToken] = await userUtils.createUniqueUserAndLogin(app)

			const createdCommentOneRes = await postUtils.addPostCommentRequest(
				app,
				userAccessToken,
				postId,
				{
					content: 'WRONG',
				},
			)

			expect(createdCommentOneRes.status).toBe(HTTP_STATUSES.BAD_REQUEST_400)
			expect(createdCommentOneRes.body).toMatchObject({
				errorsMessages: expect.any(Array),
			})
			expect(createdCommentOneRes.body.errorsMessages.length).toBe(1)
			expect(createdCommentOneRes.body.errorsMessages[0].field).toBe('content')
		})

		it('should create a comment by correct dto', async () => {
			// Create a blog
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			// Create a post
			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// User on whose behalf comments will be created
			const [userAccessToken, userId, userLogin] =
				await userUtils.createUniqueUserAndLogin(app)

			const createdCommentOneRes = await postUtils.addPostCommentRequest(
				app,
				userAccessToken,
				postId,
				{
					content: 'Content min 20 characters',
				},
			)

			commentUtils.checkCommentObj(
				createdCommentOneRes.body,
				userId,
				userLogin,
				0,
				0,
				DBTypes.LikeStatuses.None,
			)

			// Check if there are 2 posts after adding another one
			const createdCommentTwoRes = await postUtils.addPostCommentRequest(
				app,
				userAccessToken,
				postId,
				{
					content: 'Content min 22 characters',
				},
			)
			expect(createdCommentTwoRes.status).toBe(HTTP_STATUSES.CREATED_201)

			const getPostCommentsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(postId).COMMENTS.full())
				.expect(HTTP_STATUSES.OK_200)
			expect(getPostCommentsRes.body.items.length).toBe(2)
		})
	})

	describe('Getting all posts', () => {
		it('should return an object with property items contains an empty array', async () => {
			const successAnswer: GetPostsOutModel = {
				pagesCount: 0,
				page: 1,
				pageSize: 10,
				totalCount: 0,
				items: [],
			}

			await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.value)
				.expect(HTTP_STATUSES.OK_200, successAnswer)
		})

		it('should return an object with property items contains array with 2 items after creating 2 posts', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			await postUtils.addPostRequest(app, blogId)
			await postUtils.addPostRequest(app, blogId)

			const getPostsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.value)
				.expect(HTTP_STATUSES.OK_200)

			expect(getPostsRes.body.pagesCount).toBe(1)
			expect(getPostsRes.body.page).toBe(1)
			expect(getPostsRes.body.pageSize).toBe(10)
			expect(getPostsRes.body.totalCount).toBe(2)
			expect(getPostsRes.body.items.length).toBe(2)

			postUtils.checkPostObj(getPostsRes.body.items[0], 0, 0, DBTypes.LikeStatuses.None)
			postUtils.checkPostObj(getPostsRes.body.items[1], 0, 0, DBTypes.LikeStatuses.None)
		})

		it('should return an array of objects matching the queries scheme', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			await postUtils.addPostRequest(app, blogId)
			await postUtils.addPostRequest(app, blogId)
			await postUtils.addPostRequest(app, blogId)
			await postUtils.addPostRequest(app, blogId)
			await postUtils.addPostRequest(app, blogId)
			await postUtils.addPostRequest(app, blogId)
			await postUtils.addPostRequest(app, blogId)

			const getPostsRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.POSTS.value + '?pageNumber=2&pageSize=2',
			)

			expect(getPostsRes.body.page).toBe(2)
			expect(getPostsRes.body.pagesCount).toBe(4)
			expect(getPostsRes.body.totalCount).toBe(7)
			expect(getPostsRes.body.items.length).toBe(2)
		})

		it('should return an array of objects matching the queries scheme', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			await postUtils.addPostRequest(app, blogId, { title: '3' })
			await postUtils.addPostRequest(app, blogId, { title: '5' })
			await postUtils.addPostRequest(app, blogId, { title: '1' })
			await postUtils.addPostRequest(app, blogId, { title: '12' })
			await postUtils.addPostRequest(app, blogId, { title: '4' })

			const getPostsRes = await request(app.getHttpServer()).get('/' + RouteNames.POSTS.value)

			const posts = getPostsRes.body.items
			expect(posts[0].title).toBe('4')
			expect(posts[1].title).toBe('12')
			expect(posts[2].title).toBe('1')
			expect(posts[3].title).toBe('5')
			expect(posts[4].title).toBe('3')

			const getPostsAscRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.POSTS.value + '?sortDirection=asc&sortBy=title',
			)

			const postsAsc = getPostsAscRes.body.items
			expect(postsAsc[0].title).toBe('1')
			expect(postsAsc[1].title).toBe('12')
			expect(postsAsc[2].title).toBe('3')
			expect(postsAsc[3].title).toBe('4')
			expect(postsAsc[4].title).toBe('5')

			const getPostsDesc = await request(app.getHttpServer()).get(
				'/' + RouteNames.POSTS.value + '?sortDirection=desc&sortBy=title',
			)

			const postsDesc = getPostsDesc.body.items
			expect(postsDesc[0].title).toBe('5')
			expect(postsDesc[1].title).toBe('4')
			expect(postsDesc[2].title).toBe('3')
			expect(postsDesc[3].title).toBe('12')
			expect(postsDesc[4].title).toBe('1')

			const getPostsSortedByBlogName = await request(app.getHttpServer()).get(
				'/' + RouteNames.POSTS.value + '?sortBy=blogname',
			)
		})

		it('should return posts with newest post likes', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const post1 = await blogUtils.addBlogPostRequest(app, blogId, { title: '1' })
			const post1Id = post1.body.id

			// Users and their tokens
			let user1Token = ''
			let user2Token = ''
			let user3Token = ''
			let user4Token = ''

			for (let i = 0; i <= 4; i++) {
				const [userAccessToken, userId, userLogin] =
					await userUtils.createUniqueUserAndLogin(app)

				if (i == 0) {
					user1Token = userAccessToken
				} else if (i == 1) {
					user2Token = userAccessToken
				} else if (i == 2) {
					user3Token = userAccessToken
				} else if (i == 3) {
					user4Token = userAccessToken
				}
			}

			await postUtils.setPostLikeStatus(app, post1Id, user1Token, DBTypes.LikeStatuses.Like)
			await postUtils.setPostLikeStatus(app, post1Id, user2Token, DBTypes.LikeStatuses.Like)
			await postUtils.setPostLikeStatus(app, post1Id, user3Token, DBTypes.LikeStatuses.Like)
			await postUtils.setPostLikeStatus(app, post1Id, user4Token, DBTypes.LikeStatuses.Like)

			const getPostsRes = await request(app.getHttpServer()).get('/' + RouteNames.POSTS.value)

			const post = getPostsRes.body.items[0]
			expect(post.extendedLikesInfo.likesCount).toBe(4)
			expect(post.extendedLikesInfo.dislikesCount).toBe(0)
			expect(post.extendedLikesInfo.myStatus).toBe(DBTypes.LikeStatuses.None)

			expect(post.extendedLikesInfo.newestLikes).toHaveLength(3)
			expect(typeof post.extendedLikesInfo.newestLikes[0].addedAt).toBe('string')
			expect(typeof post.extendedLikesInfo.newestLikes[0].userId).toBe('string')
			expect(typeof post.extendedLikesInfo.newestLikes[0].login).toBe('string')
		})
	})

	describe('Creating a post', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.POSTS.value)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not create a post by wrong dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await postUtils.addPostRequest(app, blogId, { title: '' })
			expect(createdPostRes.status).toBe(HTTP_STATUSES.BAD_REQUEST_400)

			expect({}.toString.call(createdPostRes.body.errorsMessages)).toBe('[object Array]')
			expect(createdPostRes.body.errorsMessages.length).toBe(1)
			expect(createdPostRes.body.errorsMessages[0].field).toBe('title')
		})

		it('should create a post by correct dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)

			postUtils.checkPostObj(createdPostRes.body, 0, 0, DBTypes.LikeStatuses.None)

			// Check if there are 2 posts after adding another one
			const createdPost2Res = await postUtils.addPostRequest(app, blogId)
			expect(createdPost2Res.status).toBe(HTTP_STATUSES.CREATED_201)

			const allPostsRes = await request(app.getHttpServer()).get('/' + RouteNames.POSTS.value)
			expect(allPostsRes.body.items.length).toBe(2)
		})
	})

	describe('Getting a post', () => {
		it('should return 404 if a post does not exists', async () => {
			const getPostRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.POSTS.POST_ID('999').full,
			)
			expect(getPostRes.status).toBe(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return an existing post', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdPostId = createdPostRes.body.id

			const getPostRes = await request(app.getHttpServer()).get(
				'/' + RouteNames.POSTS.POST_ID(createdPostId).full,
			)
			expect(getPostRes.status).toBe(HTTP_STATUSES.OK_200)

			postUtils.checkPostObj(getPostRes.body, 0, 0, DBTypes.LikeStatuses.None)
		})
	})

	describe('Updating a post', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.POSTS.POST_ID('999').full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should not update a non existing post', async () => {
			await request(app.getHttpServer())
				.post('/' + RouteNames.POSTS.POST_ID('999').full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should not update a post by wrong dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			const createdPostId = createdPostRes.body.id

			await request(app.getHttpServer())
				.put('/' + RouteNames.POSTS.POST_ID(createdPostId).full)
				.send({})
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should not update a post with wrong blog id', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdPostId = createdPostRes.body.id

			const updatePostDto: CreatePostDtoModel = {
				title: 'UPDATED title',
				shortDescription: 'UPDATED shortDescription',
				content: 'UPDATED content',
				blogId: '12345',
			}

			await request(app.getHttpServer())
				.put('/' + RouteNames.POSTS.POST_ID(createdPostId).full)
				.send(updatePostDto)
				.set('authorization', adminAuthorizationValue)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should update a post by correct dto', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdPostId = createdPostRes.body.id

			const updatePostDto: CreatePostDtoModel = {
				title: 'UPDATED title',
				shortDescription: 'UPDATED shortDescription',
				content: 'UPDATED content',
				blogId,
			}

			await request(app.getHttpServer())
				.put('/' + RouteNames.POSTS.POST_ID(createdPostId).full)
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

	describe('Deleting a post', () => {
		it('should forbid a request from an unauthorized user', async () => {
			return request(app.getHttpServer()).delete('/' + RouteNames.POSTS.value)
		})

		it('should not delete a non existing post', async () => {
			await request(app.getHttpServer())
				.delete('/' + RouteNames.POSTS.POST_ID('999').full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should delete a post', async () => {
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			const blogId = createdBlogRes.body.id

			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const createdPostId = createdPostRes.body.id

			await request(app.getHttpServer())
				.delete('/' + RouteNames.POSTS.POST_ID(createdPostId).full)
				.set('authorization', adminAuthorizationValue)
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(createdPostId).full)
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})
	})

	describe('Make a post like status', () => {
		it('should forbid a request from an unauthorized user', async () => {
			await request(app.getHttpServer())
				.put('/' + RouteNames.POSTS.POST_ID('999').LIKE_STATUS.full)
				.expect(HTTP_STATUSES.UNAUTHORIZED_401)
		})

		it('should return 404 if a post does not exists', async () => {
			// User will create a post
			const [userAccessToken, userId, userLogin] =
				await userUtils.createUniqueUserAndLogin(app)

			await request(app.getHttpServer())
				.put('/' + RouteNames.POSTS.POST_ID('999').LIKE_STATUS.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.send(JSON.stringify({ likeStatus: 'None' }))
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NOT_FOUNT_404)
		})

		it('should return 400 if request body does not exist', async () => {
			// User will create a comment
			const [userAccessToken, userId, userLogin] =
				await userUtils.createUniqueUserAndLogin(app)

			await request(app.getHttpServer())
				.put('/' + RouteNames.POSTS.POST_ID('999').LIKE_STATUS.full)
				.set('authorization', 'Bearer ' + userAccessToken)
				.expect(HTTP_STATUSES.BAD_REQUEST_400)
		})

		it('should return 204 if pass right body data to right address', async () => {
			// Create a blog
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			// Create a post in the blog
			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// Create a user on behalf of which requests will be made
			const createdUserRes = await userUtils.createUniqueUser(app)
			expect(createdUserRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const loginUserRes = await userUtils.loginUser(app, userEmail, userPassword)
			const userToken = loginUserRes.body.accessToken

			// Set a like status to the post
			await request(app.getHttpServer())
				.put('/' + RouteNames.POSTS.POST_ID(postId).LIKE_STATUS.full)
				.set('authorization', 'Bearer ' + userToken)
				.send(JSON.stringify({ likeStatus: DBTypes.LikeStatuses.Like }))
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			await request(app.getHttpServer())
				.put('/' + RouteNames.POSTS.POST_ID(postId).LIKE_STATUS.full)
				.set('authorization', 'Bearer ' + userToken)
				.send(JSON.stringify({ likeStatus: DBTypes.LikeStatuses.Like }))
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.NO_CONTENT_204)

			// Get the post again to check a returned object
			const getPostRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(postId).full)
				.expect(HTTP_STATUSES.OK_200)

			postUtils.checkPostObj(getPostRes.body, 1, 0, DBTypes.LikeStatuses.None)
		})

		it('create post and make a few likes from different users', async () => {
			// Create a blog
			const createdBlogRes = await blogUtils.addBlogRequest(app)
			expect(createdBlogRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const blogId = createdBlogRes.body.id

			// Create a post
			const createdPostRes = await postUtils.addPostRequest(app, blogId)
			expect(createdPostRes.status).toBe(HTTP_STATUSES.CREATED_201)
			const postId = createdPostRes.body.id

			// Users and their tokens
			let user1Token = ''
			let user1Id = ''
			let user1Login = ''
			let user2Token = ''
			let user2Id = ''
			let user3Token = ''
			let user3Id = ''
			let user4Token = ''
			let user4Id = ''

			for (let i = 1; i <= 4; i++) {
				const [userAccessToken, userId, userLogin] =
					await userUtils.createUniqueUserAndLogin(app)

				if (i == 1) {
					user1Token = userAccessToken
					user1Id = userId
					user1Login = userLogin
				} else if (i == 2) {
					user2Token = userAccessToken
					user2Id = userId
				} else if (i == 3) {
					user3Token = userAccessToken
					user3Id = userId
				} else if (i == 4) {
					user4Token = userAccessToken
					user4Id = userId
				}
			}

			// Set a like statuses to the post
			await postUtils.setPostLikeStatus(app, postId, user1Token, DBTypes.LikeStatuses.Like)

			// Get the post again by an unauthorized user to check a returned object
			let getPostRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(postId).full)
				.expect(HTTP_STATUSES.OK_200)

			postUtils.checkPostObj(getPostRes.body, 1, 0, DBTypes.LikeStatuses.None)

			// Get the post again by an authorized user to check a returned object
			getPostRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(postId).full)
				.set('authorization', 'Bearer ' + user1Token)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.OK_200)

			postUtils.checkPostObj(getPostRes.body, 1, 0, DBTypes.LikeStatuses.Like)

			// Set a like statuses to the post
			await postUtils.setPostLikeStatus(app, postId, user2Token, DBTypes.LikeStatuses.Like)
			await postUtils.setPostLikeStatus(app, postId, user3Token, DBTypes.LikeStatuses.Like)
			await postUtils.setPostLikeStatus(app, postId, user4Token, DBTypes.LikeStatuses.Like)

			// Get the post again by an authorized user to check a returned object
			getPostRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.POST_ID(postId).full)
				.set('authorization', 'Bearer ' + user2Token)
				.set('Content-Type', 'application/json')
				.set('Accept', 'application/json')
				.expect(HTTP_STATUSES.OK_200)

			postUtils.checkPostObj(getPostRes.body, 4, 0, DBTypes.LikeStatuses.Like)
			expect(getPostRes.body.extendedLikesInfo.newestLikes.length).toBe(3)

			// Check extendedLikesInfo order
			expect(getPostRes.body.extendedLikesInfo.newestLikes[0].userId).toBe(user4Id)
			expect(getPostRes.body.extendedLikesInfo.newestLikes[1].userId).toBe(user3Id)
			expect(getPostRes.body.extendedLikesInfo.newestLikes[2].userId).toBe(user2Id)
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
				const [userAccessToken, userId, userLogin] =
					await userUtils.createUniqueUserAndLogin(app)

				if (i == 1) {
					user1Token = userAccessToken
				} else if (i == 2) {
					user2Token = userAccessToken
				} else if (i == 3) {
					user3Token = userAccessToken
				} else if (i == 4) {
					user4Token = userAccessToken
				}
			}

			async function setLikeStatus(
				userToken: string,
				postId: string,
				likeStatus: DBTypes.LikeStatuses,
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
			await setLikeStatus(user1Token, postId1, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user2Token, postId1, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user2Token, postId2, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user3Token, postId2, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user1Token, postId3, DBTypes.LikeStatuses.Dislike)
			await setLikeStatus(user1Token, postId4, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user4Token, postId4, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user2Token, postId4, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user3Token, postId4, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user2Token, postId5, DBTypes.LikeStatuses.Like)
			await setLikeStatus(user3Token, postId5, DBTypes.LikeStatuses.Dislike)
			await setLikeStatus(user1Token, postId6, DBTypes.LikeStatuses.Like)

			// Get the posts by user 1 after all likes NewestLikes should be sorted in descending
			const getPostsRes = await request(app.getHttpServer())
				.get('/' + RouteNames.POSTS.value + '?sortDirection=asc')
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

			expect(postDescItems[0].extendedLikesInfo.myStatus).toBe(DBTypes.LikeStatuses.Like)
			expect(postDescItems[2].extendedLikesInfo.myStatus).toBe(DBTypes.LikeStatuses.Dislike)
			expect(postDescItems[3].extendedLikesInfo.myStatus).toBe(DBTypes.LikeStatuses.Like)
			expect(postDescItems[5].extendedLikesInfo.myStatus).toBe(DBTypes.LikeStatuses.Like)
		})
	})
})
