import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { QuizPlayer } from '../../db/pg/entities/quizPlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { QuizPlayerServiceModel } from './models/quizGame.service.model'

@Injectable()
export class QuizPlayerRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async createPlayer(userId: string): Promise<LayerResult<string>> {
		const queryRes = await this.dataSource.getRepository(QuizPlayer).insert({
			userId,
			score: 0,
			answers: [],
		})

		return {
			code: LayerSuccessCode.Success,
			data: queryRes.identifiers[0].id.toString(),
		}
	}

	async getPlayerById(playerId: string): Promise<LayerResult<QuizPlayerServiceModel>> {
		const getPlayerRes = await this.dataSource
			.getRepository(QuizPlayer)
			.findOne({ where: { id: playerId }, relations: ['user', 'answers'] })

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

	async getPlayerByUserId(userId: string): Promise<LayerResult<QuizPlayerServiceModel>> {
		const getPlayerRes = await this.dataSource
			.getRepository(QuizPlayer)
			.findOne({ where: { userId }, relations: ['user', 'answers'] })

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

	mapDbQuizPlayerToQuizPlayer(DbQuizPlayer: QuizPlayer): QuizPlayerServiceModel {
		return {
			id: DbQuizPlayer.id.toString(),
			login: DbQuizPlayer.user.login,
		}
	}
}
