import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DbService } from '../../db/dbService'
import { TestsController } from './tests.controller'

@Module({
	imports: [TypeOrmModule.forFeature([])],
	controllers: [TestsController],
	providers: [DbService],
})
export class TestsModule {}
