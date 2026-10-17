import { ForbiddenException } from '@nestjs/common';
import { ExerciseVisibility } from './entities/exercise.entity.js';
import {
  assertCanManageExercise,
  assertCanSetVisibility,
} from './exercise.policy.js';

describe('Exercise policy', () => {
  it('allows only the owner to manage an exercise', () => {
    expect(() =>
      assertCanManageExercise('owner', { ownerId: 'owner' }),
    ).not.toThrow();
    expect(() =>
      assertCanManageExercise('other', { ownerId: 'owner' }),
    ).toThrow(ForbiddenException);
  });

  it.each([
    [ExerciseVisibility.PRIVATE, false],
    [ExerciseVisibility.PRIVATE, true],
    [ExerciseVisibility.PUBLIC, true],
  ])('allows visibility %s with admin=%s', (visibility, isAdmin) => {
    expect(() => assertCanSetVisibility(visibility, isAdmin)).not.toThrow();
  });

  it('requires administrator privileges to publish', () => {
    expect(() =>
      assertCanSetVisibility(ExerciseVisibility.PUBLIC, false),
    ).toThrow(ForbiddenException);
  });
});
