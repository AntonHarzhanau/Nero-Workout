import { Module } from '@nestjs/common';
import { ExercisesService } from './exercises.service.js';
import { ExercisesRepository } from './exercises.repository.js';
import { ExercisesController } from './exercises.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './entities/exercise.entity.js';
import { MuscleGroupsModule } from '../muscle-groups/muscle-groups.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exercise]),
    MuscleGroupsModule,
    AuthModule,
  ],
  controllers: [ExercisesController],
  providers: [ExercisesRepository, ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
