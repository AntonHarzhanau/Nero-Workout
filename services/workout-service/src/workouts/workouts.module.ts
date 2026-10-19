import { Module } from '@nestjs/common';
import { Workout } from './entities/workout.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutsRepository } from './workouts.repository.js';
import { WorkoutsService } from './workouts.service.js';
import { WorkoutsController } from './workouts.controller.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { ExercisesModule } from '../exercises/exercises.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { WorkoutSet } from './entities/workout-set.entity.js';
import { InternalAuthModule } from '../internal-auth/internal-auth.module.js';
import { WorkoutStatisticsController } from './workout-statistics.controller.js';
import { WorkoutStatisticsService } from './workout-statistics.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workout, WorkoutExercise, WorkoutSet]),
    ExercisesModule,
    AuthModule,
    InternalAuthModule,
  ],
  controllers: [WorkoutsController, WorkoutStatisticsController],
  providers: [WorkoutsRepository, WorkoutsService, WorkoutStatisticsService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
