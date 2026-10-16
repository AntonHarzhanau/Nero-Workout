import { Module } from '@nestjs/common';
import { MuscleGroupsService } from './muscle-groups.service.js';
import { MuscleGroupsController } from './muscle-groups.controller.js';
import { MuscleGroup } from './entities/muscle-group.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([MuscleGroup])],
  controllers: [MuscleGroupsController],
  providers: [MuscleGroupsService],
})
export class MuscleGroupsModule {}
