import { Module } from '@nestjs/common';
import { ExercisesService } from './exercises.service.js';
import { ExercisesController } from './exercises.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './entities/exercise.entity.js';
import { MuscleGroupsModule } from '../muscle-groups/muscle-groups.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise]), MuscleGroupsModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
