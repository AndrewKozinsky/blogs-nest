import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	NotFoundException,
	Param,
	Post,
	Put,
	Query,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common'
import { CheckAccessTokenGuard } from '../../infrastructure/guards/checkAccessToken.guard'
import { CheckAdminAuthGuard } from '../../infrastructure/guards/checkAdminAuth.guard'
import RouteNames from '../../settings/routeNames'
import { LayerResultCode } from '../../types/resultCodes'
import { CommentLikeOperationsDtoModel } from '../commentLikes/models/commentLikeOperations.input.model'
import { CommentsQueryRepository } from '../comments/comments.queryRepository'
import {
	CreatePostCommentDtoModel,
	CreatePostDtoModel,
	GetPostCommentsQueries,
	GetPostCommentsQueriesPipe,
	GetPostsQueries,
	GetPostsQueriesPipe,
	UpdatePostDtoModel,
} from './model/posts.input.model'
import { PostsQueryRepository } from './posts.queryRepository'
import { PostsService } from './posts.service'
import { Request, Response } from 'express'

@Controller(RouteNames.POSTS.value)
export class PostsController {
	constructor(
		private postsQueryRepository: PostsQueryRepository,
		private postsService: PostsService,
		private commentsQueryRepository: CommentsQueryRepository,
	) {}

	// Returns all posts
	@Get()
	async getPosts(
		@Query(new GetPostsQueriesPipe()) query: GetPostsQueries,
		@Req() req: Request,
		@Res() res: Response,
	) {
		const { user } = req

		const posts = await this.postsQueryRepository.getPosts(user?.id, query)

		res.status(HttpStatus.OK).send(posts)
	}

	// Create new post
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(CheckAdminAuthGuard)
	async createNewPost(@Body() body: CreatePostDtoModel, @Req() req: Request) {
		const { user } = req
		const createPostId = await this.postsService.createPost(body)

		return await this.postsQueryRepository.getPost(user?.id, createPostId)
	}

	// Return post by id
	@Get(':postId')
	@HttpCode(HttpStatus.OK)
	async getPost(@Param('postId') postId: string, @Res() res: Response, @Req() req: Request) {
		const { user } = req

		const post = await this.postsQueryRepository.getPost(user?.id, postId)

		if (!post) {
			throw new NotFoundException()
		}

		res.status(HttpStatus.OK).send(post)
	}

	// Update existing post by id with InputModel
	@UseGuards(CheckAdminAuthGuard)
	@Put(':postId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updatePost(@Body() body: UpdatePostDtoModel, @Param('postId') postId: string) {
		const isPostUpdated = await this.postsService.updatePost(postId, body)

		if (!isPostUpdated) {
			throw new NotFoundException()
		}
	}

	// Delete post specified by id
	@UseGuards(CheckAdminAuthGuard)
	@Delete(':postId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deletePost(@Param('postId') postId: string) {
		const isPostDeleted = await this.postsService.deletePost(postId)

		if (!isPostDeleted) {
			throw new NotFoundException()
		}
	}

	// Returns comments for specified post
	@Get(':postId/comments')
	@HttpCode(HttpStatus.OK)
	async getPostComments(
		@Req() req: Request,
		@Query(new GetPostCommentsQueriesPipe()) query: GetPostCommentsQueries,
		@Param('postId') postId: string,
	) {
		const { user } = req

		const postComments = await this.commentsQueryRepository.getPostComments(
			user?.id,
			postId,
			query,
		)

		if (postComments.status === 'postNotValid' || postComments.status === 'postNotFound') {
			throw new NotFoundException()
		}

		return postComments.data
	}

	// Create new comment
	@UseGuards(CheckAccessTokenGuard)
	@Post(':postId/comments')
	@HttpCode(HttpStatus.CREATED)
	async createComment(
		@Body() body: CreatePostCommentDtoModel,
		@Req() req: Request,
		@Param('postId') postId: string,
	) {
		const { user } = req

		const createdCommentId = await this.postsService.createPostComment(postId, body, req.user!)

		if (createdCommentId === 'postNotExist') {
			throw new NotFoundException()
		}

		const getCommentRes = await this.commentsQueryRepository.getComment(
			user!.id,
			createdCommentId,
		)

		return getCommentRes
	}

	// Make like/unlike/dislike/undislike operation
	@UseGuards(CheckAccessTokenGuard)
	@Put(':postId/like-status')
	@HttpCode(HttpStatus.NO_CONTENT)
	async setPostLikeStatus(
		@Body() body: CommentLikeOperationsDtoModel,
		@Param('postId') postId: string,
		@Req() req: Request,
	) {
		const setLikeStatus = await this.postsService.setPostLikeStatus(
			req.user!,
			postId,
			body.likeStatus,
		)

		if (setLikeStatus.code === LayerResultCode.NotFound) {
			throw new NotFoundException()
		}
	}
}
