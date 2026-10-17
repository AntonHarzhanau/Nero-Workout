import { BadRequestException } from '@nestjs/common';

export const MAX_WORKOUT_EXERCISES = 100;

export function assertCanAddWorkoutExercise(currentCount: number): void {
  if (currentCount >= MAX_WORKOUT_EXERCISES) {
    throw new BadRequestException(
      `A workout cannot contain more than ${MAX_WORKOUT_EXERCISES} exercises`,
    );
  }
}
