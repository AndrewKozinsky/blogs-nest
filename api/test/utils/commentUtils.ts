import { LikeStatuses } from '../../src/db/pg/entities/postLikes'

export const commentUtils = {
	checkCommentObj(
		commentObj: any,
		userId: string,
		userLogin: string,
		likesCount: number,
		dislikesCount: number,
		currentUserLikeStatus: LikeStatuses,
	) {
		expect(commentObj).toEqual({
			id: commentObj.id,
			content: commentObj.content,
			commentatorInfo: {
				userId,
				userLogin,
			},
			createdAt: expect.any(String),
			likesInfo: {
				likesCount,
				dislikesCount,
				myStatus: currentUserLikeStatus,
			},
		})

		expect(commentObj.createdAt).toMatch(
			/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
		)
	},
}
