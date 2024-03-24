import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Param,
	Post,
	Put,
	Query,
	Req,
	Res,
} from '@nestjs/common'
import RouteNames from '../../config/routeNames'
import { LayerResultCode } from '../../types/resultCodes'
import { CommentLikeOperationsDtoModel } from '../commentLikes/models/commentLikeOperations.input.model'
import { CommentsQueryRepository } from '../comments/comments.queryRepository'
import {
	CreatePostCommentDtoModel,
	CreatePostDtoModel,
	GetPostCommentsQueries,
	GetPostsQueries,
	UpdatePostDtoModel,
} from './model/posts.input.model'
import { PostsQueryRepository } from './posts.queryRepository'
import { PostsService } from './posts.service'
import { Request, Response } from 'express'

@Controller(RouteNames.posts)
export class PostsController {
	constructor(
		private postsQueryRepository: PostsQueryRepository,
		private postsService: PostsService,
		private commentsQueryRepository: CommentsQueryRepository,
	) {}

	// Returns all posts
	@Get()
	async getPosts(@Query() query: GetPostsQueries, @Req() req: Request, @Res() res: Response) {
		const { user } = req

		const posts = await this.postsQueryRepository.getPosts(user?.id, req.query)

		res.status(HttpStatus.OK).send(posts)
	}

	// Create new post
	@Post()
	async createNewPost(
		@Body() body: CreatePostDtoModel,
		@Req() req: Request,
		@Res() res: Response,
	) {
		const { user } = req
		const createPostId = await this.postsService.createPost(body)

		const getPostRes = await this.postsQueryRepository.getPost(user?.id, createPostId)

		res.status(HttpStatus.CREATED).send(getPostRes)
	}

	// Return post by id
	@Get('postId')
	async getPost(@Param('postId') postId: string, @Res() res: Response, @Req() req: Request) {
		const { user } = req

		const post = await this.postsQueryRepository.getPost(user?.id, postId)

		if (!post) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		res.status(HttpStatus.OK).send(post)
	}

	// Update existing post by id with InputModel
	@Put('postId')
	async updatePost(
		@Body() body: UpdatePostDtoModel,
		@Res() res: Response,
		@Param('postId') postId: string,
	) {
		const isPostUpdated = await this.postsService.updatePost(postId, body)

		if (!isPostUpdated) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		res.sendStatus(HttpStatus.NO_CONTENT)
	}

	// Delete post specified by id
	@Delete('postId')
	async deletePost(@Res() res: Response, @Param('postId') postId: string) {
		const isPostDeleted = await this.postsService.deletePost(postId)

		if (!isPostDeleted) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		res.sendStatus(HttpStatus.NO_CONTENT)
	}

	// Returns comments for specified post
	@Get(':postId/comments')
	@HttpCode(HttpStatus.OK)
	async getPostComments(
		@Query() query: GetPostCommentsQueries,
		@Res() res: Response,
		@Req() req: Request,
		@Param('postId') postId: string,
	) {
		const { user } = req

		const postComments = await this.commentsQueryRepository.getPostComments(
			user?.id,
			postId,
			req.query,
		)

		if (postComments.status === 'postNotValid' || postComments.status === 'postNotFound') {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		res.status(HttpStatus.OK).send(postComments.data)
	}

	// Create new comment
	@Post(':postId/comments')
	async createComment(
		@Body() body: CreatePostCommentDtoModel,
		@Res() res: Response,
		@Req() req: Request,
		@Param('postId') postId: string,
	) {
		const { user } = req

		const createdCommentId = await this.postsService.createPostComment(postId, body, req.user!)

		if (createdCommentId === 'postNotExist') {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		const getCommentRes = await this.commentsQueryRepository.getComment(
			user!.id,
			createdCommentId,
		)

		res.status(HttpStatus.CREATED).send(getCommentRes)
	}

	// Make like/unlike/dislike/undislike operation
	@Put(':postId/like-status')
	async setPostLikeStatus(
		@Body() body: CommentLikeOperationsDtoModel,
		@Res() res: Response,
		@Param('postId') postId: string,
		@Req() req: Request,
	) {
		const setLikeStatus = await this.postsService.setPostLikeStatus(
			req.user!,
			postId,
			body.likeStatus,
		)

		if (setLikeStatus.code === LayerResultCode.NotFound) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		res.sendStatus(HttpStatus.OK)
	}
}
