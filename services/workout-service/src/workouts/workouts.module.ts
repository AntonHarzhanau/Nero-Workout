import { Module } from '@nestjs/common';
import { WorkoutsService } from './workouts.service.js';
import { WorkoutsController } from './workouts.controller.js';

@Module({
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
})
export class WorkoutsModule {}
