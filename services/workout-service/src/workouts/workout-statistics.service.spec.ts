import { BadRequestException } from '@nestjs/common';
import { Workout } from './entities/workout.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { WorkoutSet } from './entities/workout-set.entity.js';
import { WorkoutStatisticsService } from './workout-statistics.service.js';
import type { WorkoutsRepository } from './workouts.repository.js';

function setup() {
  const workout: Workout = Object.assign(new Workout(), {
    id: 'workout',
    ownerId: 'owner',
    title: 'Private title',
    workoutDate: '2026-10-15',
    durationMinutes: 65,
    description: 'Private note',
    exercises: [
      Object.assign(new WorkoutExercise(), {
        id: 'inclusion',
        exerciseId: 'exercise',
        position: 1,
        exerciseNameSnapshot: 'Squat',
        muscleGroupsSnapshot: ['core', 'legs'],
        // Catalog relations must never override the stored snapshot.
        exercise: { title: 'Renamed', muscleGroups: [{ code: 'chest' }] },
        sets: [
          Object.assign(new WorkoutSet(), {
            id: 'set1',
            position: 1,
            weightKg: '100.00',
            reps: 5,
          }),
          Object.assign(new WorkoutSet(), {
            id: 'set2',
            position: 2,
            weightKg: '0.00',
            reps: 12,
          }),
        ],
      }),
      Object.assign(new WorkoutExercise(), {
        exerciseId: 'exercise',
        exerciseNameSnapshot: 'Older squat',
        muscleGroupsSnapshot: [],
        sets: [],
      }),
    ],
  });
  const repository = {
    findForStatistics: vi.fn().mockResolvedValue([workout]),
  };
  const service = new WorkoutStatisticsService(
    repository as unknown as WorkoutsRepository,
  );
  return { service, repository, workout };
}

describe('WorkoutStatisticsService', () => {
  it.each([
    {},
    { from: '2026-10-01' },
    { to: '2026-10-31' },
    { from: '2026-10-01', to: '2026-10-31' },
    { from: '2026-10-15', to: '2026-10-15' },
  ])(
    'returns only the agreed snapshot fields and forwards the exact range %j',
    async (range) => {
      const { service, repository, workout } = setup();
      const original = structuredClone(workout);
      const result = await service.findForUser('requested-user', range);
      expect(repository.findForStatistics).toHaveBeenCalledExactlyOnceWith(
        'requested-user',
        range,
      );
      expect(result).toEqual([
        {
          id: 'workout',
          workoutDate: '2026-10-15',
          durationMinutes: 65,
          exercises: [
            {
              exerciseId: 'exercise',
              exerciseName: 'Squat',
              muscleGroups: ['core', 'legs'],
              sets: [
                { weightKg: '100.00', reps: 5 },
                { weightKg: '0.00', reps: 12 },
              ],
            },
            {
              exerciseId: 'exercise',
              exerciseName: 'Older squat',
              muscleGroups: [],
              sets: [],
            },
          ],
        },
      ]);
      expect(structuredClone(workout)).toEqual(original);
      result[0].exercises[0].muscleGroups.push('changed');
      expect(workout.exercises[0].muscleGroupsSnapshot).toEqual([
        'core',
        'legs',
      ]);
    },
  );

  it('rejects a reversed date range before querying the database', async () => {
    const { service, repository } = setup();
    await expect(
      service.findForUser('owner', { from: '2026-11-01', to: '2026-10-31' }),
    ).rejects.toThrow(new BadRequestException('from must be on or before to'));
    expect(repository.findForStatistics).not.toHaveBeenCalled();
  });

  it('returns an empty array for users without workouts', async () => {
    const { service, repository } = setup();
    repository.findForStatistics.mockResolvedValue([]);
    await expect(service.findForUser('empty-user', {})).resolves.toEqual([]);
  });

  it.each([null, 0])(
    'preserves duration %s and empty workouts',
    async (durationMinutes) => {
      const { service, workout } = setup();
      workout.durationMinutes = durationMinutes;
      workout.exercises = [];
      await expect(service.findForUser('owner', {})).resolves.toEqual([
        {
          id: 'workout',
          workoutDate: '2026-10-15',
          durationMinutes,
          exercises: [],
        },
      ]);
    },
  );

  it('preserves repository order across multiple workouts', async () => {
    const { service, repository, workout } = setup();
    const earlier = Object.assign(new Workout(), workout, {
      id: 'earlier',
      workoutDate: '2026-10-01',
    });
    repository.findForStatistics.mockResolvedValue([earlier, workout]);
    const result = await service.findForUser('owner', {});
    expect(result.map((item) => [item.id, item.workoutDate])).toEqual([
      ['earlier', '2026-10-01'],
      ['workout', '2026-10-15'],
    ]);
  });

  it('propagates database failures instead of returning an empty success', async () => {
    const { service, repository } = setup();
    const error = new Error('Database unavailable');
    repository.findForStatistics.mockRejectedValue(error);
    await expect(service.findForUser('owner', {})).rejects.toBe(error);
  });
});
