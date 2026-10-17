import { BadRequestException } from '@nestjs/common';

export const MAX_PLAN_EXERCISES = 200;

export function assertCanAddPlanExercise(currentCount: number): void {
  if (currentCount >= MAX_PLAN_EXERCISES) {
    throw new BadRequestException(
      `A plan cannot contain more than ${MAX_PLAN_EXERCISES} exercises`,
    );
  }
}
