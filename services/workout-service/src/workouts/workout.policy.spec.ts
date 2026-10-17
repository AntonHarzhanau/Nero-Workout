import { BadRequestException } from '@nestjs/common';
import { assertCanAddWorkoutExercise } from './workout.policy.js';

describe('Workout capacity', () => {
  it.each([0, 99])(
    'allows adding when the workout contains %i exercises',
    (count) => {
      expect(() => assertCanAddWorkoutExercise(count)).not.toThrow();
    },
  );

  it.each([100, 101])(
    'rejects adding when the workout contains %i exercises',
    (count) => {
      expect(() => assertCanAddWorkoutExercise(count)).toThrow(
        new BadRequestException(
          'A workout cannot contain more than 100 exercises',
        ),
      );
    },
  );
});
