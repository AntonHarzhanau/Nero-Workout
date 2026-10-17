import { ExerciseVisibility } from '../exercises/entities/exercise.entity.js';
import type { ExerciseView } from '../exercises/exercise.types.js';
import { Workout } from './entities/workout.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { WorkoutSet } from './entities/workout-set.entity.js';
import {
  toWorkoutExerciseValues,
  toWorkoutSummary,
  toWorkoutValues,
  toWorkoutView,
} from './workout.mapper.js';

function fixture() {
  const exercise: ExerciseView = {
    id: 'one',
    ownerId: 'owner',
    title: 'Latest catalog title',
    description: null,
    equipment: null,
    visibility: ExerciseVisibility.PRIVATE,
    muscleGroups: [],
    createdAt: new Date('2026-10-16T10:00:00Z'),
    updatedAt: new Date('2026-10-17T11:00:00Z'),
  };
  const workout = Object.assign(new Workout(), {
    id: 'workout',
    ownerId: 'owner',
    title: 'Legs',
    description: 'Notes',
    workoutDate: '2026-10-17',
    durationMinutes: 0,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
    exercises: ['one', 'two', 'one'].map((exerciseId, index) =>
      Object.assign(new WorkoutExercise(), {
        id: `inclusion-${index}`,
        workoutId: 'workout',
        exerciseId,
        position: index + 1,
        sets: [
          Object.assign(new WorkoutSet(), {
            id: `set-${index}`,
            position: 1,
            weightKg: '12.50',
            reps: 8,
          }),
        ],
      }),
    ),
  });
  return { exercise, workout };
}

describe('Workout mapper', () => {
  it('normalizes nested positions and decimal weights without modifying the DTO', () => {
    const dto = {
      title: '  Legs  ',
      workoutDate: '2026-10-17',
      durationMinutes: 0,
      description: '',
      exercises: [
        {
          exerciseId: 'one',
          sets: [
            { weightKg: 0, reps: 20 },
            { weightKg: 12.5, reps: 8 },
          ],
        },
        { exerciseId: 'two', sets: [{ weightKg: 9999.99, reps: 1 }] },
      ],
    };
    const original = structuredClone(dto);
    expect(toWorkoutValues(dto)).toEqual({
      title: 'Legs',
      workoutDate: '2026-10-17',
      durationMinutes: 0,
      description: '',
      exercises: [
        {
          exerciseId: 'one',
          position: 1,
          sets: [
            { position: 1, weightKg: '0.00', reps: 20 },
            { position: 2, weightKg: '12.50', reps: 8 },
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

  it('supplies null defaults and supports an empty workout', () => {
    expect(
      toWorkoutValues({
        title: '  Rest  ',
        workoutDate: '2026-10-18',
        exercises: [],
      }),
    ).toEqual({
      title: 'Rest',
      workoutDate: '2026-10-18',
      description: null,
      durationMinutes: null,
      exercises: [],
    });
  });

  it('preserves explicit optional values', () => {
    expect(
      toWorkoutValues({
        title: 'Legs',
        workoutDate: '2026-10-17',
        durationMinutes: 45,
        description: 'Notes',
        exercises: [],
      }),
    ).toMatchObject({ durationMinutes: 45, description: 'Notes' });
    expect(
      toWorkoutValues({
        title: 'Legs',
        workoutDate: '2026-10-17',
        durationMinutes: null,
        description: null,
        exercises: [],
      }),
    ).toMatchObject({ durationMinutes: null, description: null });
  });

  it('leaves an appended inclusion position to the repository and allows empty sets', () => {
    expect(toWorkoutExerciseValues({ exerciseId: 'one', sets: [] })).toEqual({
      exerciseId: 'one',
      sets: [],
    });
  });

  it('lists only header fields, including date and duration', () => {
    const { workout } = fixture();
    expect(toWorkoutSummary(workout)).toEqual({
      id: 'workout',
      ownerId: 'owner',
      title: 'Legs',
      description: 'Notes',
      workoutDate: '2026-10-17',
      durationMinutes: 0,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
    });
  });

  it('matches current catalog data by ID while preserving repeated inclusions, sets and order', () => {
    const { workout, exercise } = fixture();
    const second = { ...exercise, id: 'two', title: 'Second exercise' };
    const original = structuredClone(workout);
    const view = toWorkoutView(workout, [second, exercise]);
    expect(view).toEqual({
      ...toWorkoutSummary(workout),
      exercises: [exercise, second, exercise].map((item, index) => ({
        id: `inclusion-${index}`,
        exerciseId: item.id,
        position: index + 1,
        exercise: item,
        sets: [{ id: `set-${index}`, position: 1, weightKg: '12.50', reps: 8 }],
      })),
    });
    expect(structuredClone(workout)).toEqual(original);
    expect(view.exercises[0]).not.toHaveProperty('workoutId');
  });

  it('fails explicitly if catalog data for an inclusion is missing', () => {
    const { workout, exercise } = fixture();
    expect(() => toWorkoutView(workout, [exercise])).toThrow(
      'Missing exercise data: two',
    );
  });

  it('maps a workout without inclusions and an inclusion without sets', () => {
    const { workout, exercise } = fixture();
    workout.exercises = [workout.exercises[0]];
    workout.exercises[0].sets = [];
    expect(toWorkoutView(workout, [exercise]).exercises[0].sets).toEqual([]);
    workout.exercises = [];
    expect(toWorkoutView(workout, []).exercises).toEqual([]);
  });
});
