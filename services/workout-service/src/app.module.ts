import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PlansModule } from './plans/plans.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { ExercisesModule } from './exercises/exercises.module.js';
import { MuscleGroupsModule } from './muscle-groups/muscle-groups.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    PlansModule,
    ExercisesModule,
    MuscleGroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
