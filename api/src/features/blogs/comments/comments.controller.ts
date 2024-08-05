import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Put,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { CheckAccessTokenGuard } from '../../../infrastructure/guards/checkAccessToken.guard'
import RouteNames from '../../../settings/routeNames'
import { LayerErrorCode } from '../../../types/resultCodes'
import { CommentLikeOperationsDtoModel } from '../commentLikes/models/commentLikeOperations.input.model'
import { CommentsQueryRepository } from './commentsQueryRepository'
import { UpdateCommentDtoModel } from './model/comments.input.model'
import { DeleteCommentUseCase } from './use-cases/DeleteCommentUseCase'
import { SetCommentLikeStatusUseCase } from './use-cases/SetCommentLikeStatusUseCase'
import { UpdateCommentUseCase } from './use-cases/UpdateCommentUseCase'

@Controller(RouteNames.COMMENTS.value)
export class CommentsController {
	constructor(
		private commentsQueryRepository: CommentsQueryRepository,
		private updateCommentUseCase: UpdateCommentUseCase,
		private deleteCommentUseCase: DeleteCommentUseCase,
		private setCommentLikeStatusUseCase: SetCommentLikeStatusUseCase,
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
			throw new NotFoundException()
		}

		res.status(HttpStatus.OK).send(comment)
	}

	// Update existing comment by id with InputModel
	@UseGuards(CheckAccessTokenGuard)
	@Put(':commentId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async updateComment(
		@Param('commentId') commentId: string,
		@Body() body: UpdateCommentDtoModel,
		@Req() req: Request,
	) {
		const updateCommentStatus = await this.updateCommentUseCase.execute(
			req.user!,
			commentId,
			body,
		)

		if (updateCommentStatus === 'notOwner') {
			throw new ForbiddenException()
		}

		if (!updateCommentStatus) {
			throw new NotFoundException()
		}
	}

	// Delete comment specified by id
	@UseGuards(CheckAccessTokenGuard)
	@Delete(':commentId')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteComment(@Param('commentId') commentId: string, @Req() req: Request) {
		const deleteCommentStatus = await this.deleteCommentUseCase.execute(req.user!, commentId)

		if (deleteCommentStatus === 'notOwner') {
			throw new ForbiddenException()
		}

		if (!deleteCommentStatus) {
			throw new NotFoundException()
		}
	}

	// Make like/unlike/dislike/undislike operation
	@UseGuards(CheckAccessTokenGuard)
	@Put(':commentId/like-status')
	@HttpCode(HttpStatus.NO_CONTENT)
	async setCommentLikeStatus(
		@Param('commentId') commentId: string,
		@Body() body: CommentLikeOperationsDtoModel,
		@Req() req: Request,
	) {
		const setLikeStatus = await this.setCommentLikeStatusUseCase.execute(
			req.user!,
			commentId,
			body.likeStatus,
		)

		if (setLikeStatus.code === LayerErrorCode.NotFound_404) {
			throw new NotFoundException()
		}
	}
}
