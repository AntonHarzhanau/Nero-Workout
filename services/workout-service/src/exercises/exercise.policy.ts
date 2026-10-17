import { ForbiddenException } from '@nestjs/common';
import { ExerciseVisibility } from './entities/exercise.entity.js';

export function assertCanManageExercise(
  userId: string,
  exercise: { ownerId: string },
): void {
  if (exercise.ownerId !== userId) {
    throw new ForbiddenException(
      'You do not have permission to modify this exercise',
    );
  }
}

export function assertCanSetVisibility(
  visibility: ExerciseVisibility,
  isAdmin: boolean,
): void {
  if (visibility === ExerciseVisibility.PUBLIC && !isAdmin) {
    throw new ForbiddenException(
      'Public exercises can only be created by administrators',
    );
  }
}
