import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PlansModule } from './plans/plans.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { ExercisesModule } from './exercises/exercises.module.js';
import { MuscleGroupsModule } from './muscle-groups/muscle-groups.module.js';
import { WorkoutsModule } from './workouts/workouts.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    PlansModule,
    ExercisesModule,
    MuscleGroupsModule,
    WorkoutsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
