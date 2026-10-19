import { Module } from '@nestjs/common';
import { InternalAuthModule } from '../internal-auth/internal-auth.module.js';
import { ExercisesModule } from '../exercises/exercises.module.js';
import { WorkoutsModule } from '../workouts/workouts.module.js';
import { PlansModule } from '../plans/plans.module.js';
import { UserCleanupController } from './user-cleanup.controller.js';
import { UserCleanupService } from './user-cleanup.service.js';

@Module({
  imports: [InternalAuthModule, ExercisesModule, PlansModule, WorkoutsModule],
  controllers: [UserCleanupController],
  providers: [UserCleanupService],
})
export class UserCleanupModule {}
