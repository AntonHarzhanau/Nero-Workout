import { Module } from '@nestjs/common';
import { ExercisesService } from './exercises.service.js';
import { ExercisesController } from './exercises.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './entities/exercise.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise])],
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
