import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GamePlayer } from '../../db/pg/entities/game/gamePlayer'
import { LayerErrorCode, LayerResult, LayerSuccessCode } from '../../types/resultCodes'
import { GamePlayerOutModel } from './models/game.output.model'

@Injectable()
export class GamePlayerQueryRepository {
	constructor(@InjectDataSource() private dataSource: DataSource) {}

	async getPlayer(playerId: string): Promise<LayerResult<GamePlayerOutModel>> {
		const getPlayerRes = await this.dataSource
			.getRepository(GamePlayer)
			.findOneBy({ id: playerId })

		if (!getPlayerRes) {
			return {
				code: LayerErrorCode.NotFound_404,
			}
		}

		return {
			code: LayerSuccessCode.Success,
			data: this.mapDbGamePlayerToOutGamePlayer(getPlayerRes),
		}
	}

	mapDbGamePlayerToOutGamePlayer(DbGamePlayer: GamePlayer): GamePlayerOutModel {
		return {
			id: DbGamePlayer.id.toString(),
			login: DbGamePlayer.user.login,
		}
	}
}
