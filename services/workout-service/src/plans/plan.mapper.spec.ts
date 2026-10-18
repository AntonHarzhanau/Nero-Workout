import {
  toPlanExerciseValues,
  toPlanValues,
  toPlanView,
} from './plan.mapper.js';
import { PlanExercise } from './entities/plan-exercise.entity.js';
import { Plan } from './entities/plan.entity.js';
import type { ExerciseView } from '../exercises/exercise.types.js';
import { ExerciseVisibility } from '../exercises/entities/exercise.entity.js';

describe('Plan mapper', () => {
  it('reports the missing catalog ID instead of producing incomplete detail data', () => {
    const plan = Object.assign(new Plan(), {
      planExercises: [
        Object.assign(new PlanExercise(), {
          exerciseId: 'missing-catalog-id',
          sets: [],
        }),
      ],
    });
    expect(() => toPlanView(plan, [])).toThrow(
      new Error('Missing exercise data: missing-catalog-id'),
    );
  });

  it('assigns exercise and set positions and normalizes decimal weights without changing input', () => {
    const dto = {
      title: '  Plan  ',
      exercises: [
        {
          exerciseId: 'one',
          sets: [
            { weightKg: 0, reps: 8 },
            { weightKg: 12.5, reps: 10 },
          ],
        },
        { exerciseId: 'two', sets: [{ weightKg: 9999.99, reps: 1 }] },
      ],
    };
    const original = structuredClone(dto);
    expect(toPlanValues(dto)).toEqual({
      title: 'Plan',
      description: null,
      exercises: [
        {
          exerciseId: 'one',
          position: 1,
          sets: [
            { position: 1, weightKg: '0.00', reps: 8 },
            { position: 2, weightKg: '12.50', reps: 10 },
          ],
        },
        {
          exerciseId: 'two',
          position: 2,
          sets: [{ position: 1, weightKg: '9999.99', reps: 1 }],
        },
      ],
    });
    expect(dto).toEqual(original);
  });

  it('keeps an empty set list and leaves inclusion position to the repository', () => {
    expect(toPlanExerciseValues({ exerciseId: 'one', sets: [] })).toEqual({
      exerciseId: 'one',
      sets: [],
    });
  });

  it('matches catalog data by ID and preserves repeated inclusions and their order', () => {
    const first: ExerciseView = {
      id: 'one',
      ownerId: 'owner',
      title: 'Latest title',
      description: null,
      equipment: null,
      visibility: ExerciseVisibility.PRIVATE,
      createdAt: new Date(),
      updatedAt: new Date(),
      muscleGroups: [],
    };
    const second: ExerciseView = { ...first, id: 'two', title: 'Second' };
    const plan = Object.assign(new Plan(), {
      id: 'plan',
      ownerId: 'owner',
      title: 'Plan',
      description: null,
      createdAt: first.createdAt,
      updatedAt: first.updatedAt,
      planExercises: ['one', 'two', 'one'].map((exerciseId, index) =>
        Object.assign(new PlanExercise(), {
          id: `inclusion-${index}`,
          exerciseId,
          position: index + 1,
          sets: [],
        }),
      ),
    });
    const result = toPlanView(plan, [second, first]);
    expect(result.exercises.map((item) => item.exercise.title)).toEqual([
      'Latest title',
      'Second',
      'Latest title',
    ]);
    expect(result).not.toHaveProperty('planExercises');
  });
});
