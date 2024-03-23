import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Put,
	Req,
	Res,
} from '@nestjs/common'
import { Request, Response } from 'express'
import RouteNames from '../../config/routeNames'
import { LayerResultCode } from '../../types/resultCodes'
import { CommentLikeOperationsDtoModel } from '../commentLikes/models/commentLikeOperations.input.model'
import { CommentsQueryRepository } from './comments.queryRepository'
import { CommentsService } from './comments.service'
import { UpdateCommentDtoModel } from './model/comments.input.model'

@Controller(RouteNames.comments)
export class CommentsController {
	constructor(
		private commentsQueryRepository: CommentsQueryRepository,
		private commentsService: CommentsService,
	) {}

	// Return comment by id
	@Get(':commentId')
	@HttpCode(HttpStatus.OK)
	async getComment(
		@Param('commentId') commentId: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		const { user } = req

		const comment = await this.commentsQueryRepository.getComment(user?.id, commentId)

		if (!comment) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}

		return comment
	}

	// Update existing comment by id with InputModel
	@Put(':commentId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updateComment(
		@Param('commentId') commentId: string,
		@Body() body: UpdateCommentDtoModel,
		@Res() res: Response,
		@Req() req: Request,
	) {
		const updateCommentStatus = await this.commentsService.updateComment(
			req.user!,
			commentId,
			body,
		)

		if (updateCommentStatus === 'notOwner') {
			res.sendStatus(HttpStatus.FORBIDDEN)
			return
		}

		if (!updateCommentStatus) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}
	}

	// ----

	// Delete comment specified by id
	@Delete(':commentId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteComment(
		@Param('commentId') commentId: string,
		@Res() res: Response,
		@Req() req: Request,
	) {
		const deleteCommentStatus = await this.commentsService.deleteComment(req.user!, commentId)

		if (deleteCommentStatus === 'notOwner') {
			res.sendStatus(HttpStatus.FORBIDDEN)
			return
		}

		if (!deleteCommentStatus) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}
	}

	// ----

	// Make like/unlike/dislike/undislike operation
	@Put(':commentId/like-status')
	@HttpCode(HttpStatus.NO_CONTENT)
	async setCommentLikeStatus(
		@Param('commentId') commentId: string,
		@Body() body: CommentLikeOperationsDtoModel,
		@Res() res: Response,
		@Req() req: Request,
	) {
		const setLikeStatus = await this.commentsService.setCommentLikeStatus(
			req.user!,
			commentId,
			body.likeStatus,
		)

		if (setLikeStatus.code === LayerResultCode.NotFound) {
			res.sendStatus(HttpStatus.NOT_FOUND)
			return
		}
	}
}
