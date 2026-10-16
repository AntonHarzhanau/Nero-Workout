import { Module } from '@nestjs/common';
import { ExercisesService } from './exercises.service.js';
import { ExercisesController } from './exercises.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './entities/exercise.entity.js';
import { MuscleGroupsController } from '../muscle-groups/muscle-groups.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise])],
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
