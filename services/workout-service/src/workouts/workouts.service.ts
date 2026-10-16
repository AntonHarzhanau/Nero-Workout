import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { WorkoutExerciseInputDto } from './dto/create-workout.dto.js';
import {
  Exercise,
  ExerciseVisibility,
} from '../exercises/entities/exercise.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';

@Injectable()
export class WorkoutsService {
  constructor(private readonly dataSource: DataSource) {}

  private async checkExercises(
    manager: EntityManager,
    ownerId: string,
    inputs: WorkoutExerciseInputDto[],
  ) {
    const ids = [...new Set(inputs.map((input) => input.exerciseId))];

    if (ids.length === 0) {
      return;
    }

    const availableExercises = await manager.getRepository(Exercise).find({
      select: {
        id: true,
      },
      where: [
        { id: In(ids), ownerId },
        { id: In(ids), visibility: ExerciseVisibility.PUBLIC },
      ],
    });

    if (availableExercises.length !== ids.length) {
        throw new Error('Some exercises are not available for the user');
    }
  }

  private async saveExercises(
    manager: EntityManager,
    workoutId: string,
    inputs: WorkoutExerciseInputDto[],
  ): Promise<void> {
    const exerciseRepository = manager.getRepository(WorkoutExercise);

  }
}
