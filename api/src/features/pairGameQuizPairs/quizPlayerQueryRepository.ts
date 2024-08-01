import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { QuizPlayer } from '../../db/pg/entities/quizPlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { QuizPlayerOutModel } from './models/quizGame.output.model'

@Injectable()
export class QuizPlayerQueryRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPlayer(playerId: string): Promise<LayerResult<QuizPlayerOutModel>> {
		const getPlayerRes = await this.dataSource
			.getRepository(QuizPlayer)
			.findOneBy({ id: playerId })

		if (!getPlayerRes) {
			return {
				code: LayerErrorCode.NotFound,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbQuizPlayerToQuizPlayer(getPlayerRes),
		}
	}

	mapDbQuizPlayerToQuizPlayer(DbQuizPlayer: QuizPlayer): QuizPlayerOutModel {
		return {
			id: DbQuizPlayer.id.toString(),
			login: DbQuizPlayer.user.login,
		}
	}
}
