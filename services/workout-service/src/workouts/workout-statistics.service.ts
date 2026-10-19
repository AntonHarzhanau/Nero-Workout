import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  WorkoutStatisticsRange,
  WorkoutStatisticsView,
} from './workout.types.js';
import { WorkoutsRepository } from './workouts.repository.js';

@Injectable()
export class WorkoutStatisticsService {
  constructor(private readonly workoutsRepository: WorkoutsRepository) {}

  async findForUser(
    userId: string,
    range: WorkoutStatisticsRange,
  ): Promise<WorkoutStatisticsView[]> {
    const { from = '', to = '9999-12-31' } = range;
    if (from > to) {
      throw new BadRequestException('from must be on or before to');
    }

    const workouts = await this.workoutsRepository.findForStatistics(
      userId,
      range,
    );
    return workouts.map((workout) => ({
      id: workout.id,
      workoutDate: workout.workoutDate,
      durationMinutes: workout.durationMinutes,
      exercises: workout.exercises.map((item) => ({
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseNameSnapshot,
        muscleGroups: [...item.muscleGroupsSnapshot],
        sets: item.sets.map((set) => ({
          weightKg: set.weightKg,
          reps: set.reps,
        })),
      })),
    }));
  }
}
