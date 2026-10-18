import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExercisesModule } from '../exercises/exercises.module.js';
import { WorkoutsModule } from '../workouts/workouts.module.js';
import { PlansModule } from '../plans/plans.module.js';
import { UserCleanupController } from './user-cleanup.controller.js';
import { UserCleanupService } from './user-cleanup.service.js';
import { InternalTokenGuard } from './internal-token.guard.js';

@Module({
  imports: [ConfigModule, ExercisesModule, PlansModule, WorkoutsModule],
  controllers: [UserCleanupController],
  providers: [InternalTokenGuard, UserCleanupService],
})
export class UserCleanupModule {}
