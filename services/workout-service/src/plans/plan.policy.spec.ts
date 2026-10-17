import { BadRequestException } from '@nestjs/common';
import { assertCanAddPlanExercise, MAX_PLAN_EXERCISES } from './plan.policy.js';

describe('Plan capacity', () => {
  it.each([0, MAX_PLAN_EXERCISES - 1])(
    'allows adding when the plan contains %i exercises',
    (count) => {
      expect(() => assertCanAddPlanExercise(count)).not.toThrow();
    },
  );

  it.each([MAX_PLAN_EXERCISES, MAX_PLAN_EXERCISES + 1])(
    'rejects adding when the plan contains %i exercises',
    (count) => {
      expect(() => assertCanAddPlanExercise(count)).toThrow(
        BadRequestException,
      );
    },
  );
});
