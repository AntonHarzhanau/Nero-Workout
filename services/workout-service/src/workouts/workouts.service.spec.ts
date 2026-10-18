import type { EntityManager } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ExercisesService } from '../exercises/exercises.service.js';
import { ExerciseVisibility } from '../exercises/entities/exercise.entity.js';
import type { ExerciseView } from '../exercises/exercise.types.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { WorkoutSet } from './entities/workout-set.entity.js';
import { Workout } from './entities/workout.entity.js';
import type { WorkoutsRepository } from './workouts.repository.js';
import { WorkoutsService } from './workouts.service.js';

const exercise: ExerciseView = {
  id: 'exercise',
  ownerId: 'owner',
  title: 'Current catalog title',
  description: null,
  equipment: null,
  visibility: ExerciseVisibility.PRIVATE,
  createdAt: new Date('2026-10-17T10:00:00Z'),
  updatedAt: new Date('2026-10-17T10:00:00Z'),
  muscleGroups: [],
};

function setup() {
  const item = Object.assign(new WorkoutExercise(), {
    id: 'inclusion',
    workoutId: 'workout',
    exerciseId: exercise.id,
    position: 1,
    sets: [
      Object.assign(new WorkoutSet(), {
        id: 'set',
        position: 1,
        weightKg: '50.00',
        reps: 10,
      }),
    ],
  });
  const workout = Object.assign(new Workout(), {
    id: 'workout',
    ownerId: 'owner',
    title: 'Chest',
    workoutDate: '2026-10-17',
    durationMinutes: 60,
    description: null,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
    exercises: [item],
  });
  const repository = {
    findMine: vi.fn().mockResolvedValue([workout]),
    findOwnedById: vi.fn().mockResolvedValue(workout),
    existsOwned: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(workout),
    replaceOwned: vi.fn().mockResolvedValue(undefined),
    appendExercise: vi.fn().mockResolvedValue(item),
    removeExercise: vi.fn().mockResolvedValue(undefined),
    deleteOwned: vi.fn().mockResolvedValue(true),
  };
  const exercises = {
    assertAvailableToUser: vi.fn().mockResolvedValue(undefined),
    getAvailableByIds: vi.fn().mockResolvedValue([exercise]),
    findOne: vi.fn().mockResolvedValue(exercise),
  };
  const service = new WorkoutsService(
    repository as unknown as WorkoutsRepository,
    exercises as unknown as ExercisesService,
  );
  const dto = {
    title: '  Chest  ',
    workoutDate: '2026-10-17',
    durationMinutes: 60,
    exercises: [
      { exerciseId: exercise.id, sets: [{ weightKg: 50, reps: 10 }] },
    ],
  };
  return { service, repository, exercises, workout, item, dto };
}

describe('WorkoutsService', () => {
  it('returns summaries without fetching catalog data', async () => {
    const { service, repository, exercises } = setup();
    const result = await service.findMine('owner');
    expect(repository.findMine).toHaveBeenCalledWith('owner');
    expect(result[0]).not.toHaveProperty('exercises');
    expect(result[0]).toMatchObject({
      workoutDate: '2026-10-17',
      durationMinutes: 60,
    });
    expect(exercises.getAvailableByIds).not.toHaveBeenCalled();
  });

  it('loads current exercise data through ExercisesService for details', async () => {
    const { service, repository, exercises } = setup();
    const result = await service.findOne('owner', 'workout');
    expect(repository.findOwnedById).toHaveBeenCalledWith('owner', 'workout');
    expect(exercises.getAvailableByIds).toHaveBeenCalledWith('owner', [
      'exercise',
    ]);
    expect(result.exercises[0]).toMatchObject({
      id: 'inclusion',
      exercise,
      sets: [{ weightKg: '50.00', reps: 10 }],
    });
  });

  it('rejects missing or foreign workouts before loading exercises', async () => {
    const { service, repository, exercises } = setup();
    repository.findOwnedById.mockResolvedValue(null);
    await expect(service.findOne('other', 'workout')).rejects.toThrow(
      new NotFoundException('Workout not found'),
    );
    expect(exercises.getAvailableByIds).not.toHaveBeenCalled();
  });

  it('rejects unavailable exercises before creating a workout', async () => {
    const { service, repository, exercises, dto } = setup();
    exercises.assertAvailableToUser.mockRejectedValue(
      new BadRequestException(),
    );
    await expect(service.create('owner', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('normalizes nested input before saving and returns workout details', async () => {
    const { service, repository, exercises, dto } = setup();
    const result = await service.create('owner', dto);
    expect(exercises.assertAvailableToUser).toHaveBeenCalledWith('owner', [
      'exercise',
    ]);
    expect(repository.create).toHaveBeenCalledWith('owner', {
      title: 'Chest',
      workoutDate: '2026-10-17',
      durationMinutes: 60,
      description: null,
      exercises: [
        {
          exerciseId: 'exercise',
          position: 1,
          sets: [{ position: 1, weightKg: '50.00', reps: 10 }],
        },
      ],
    });
    expect(result.id).toBe('workout');
  });

  it.each(['other', 'admin'])(
    'prevents %s from replacing another owner’s workout',
    async (userId) => {
      const { service, repository, exercises, dto } = setup();
      repository.existsOwned.mockResolvedValue(false);
      await expect(service.update(userId, 'workout', dto)).rejects.toThrow(
        new NotFoundException('Workout not found'),
      );
      expect(repository.existsOwned).toHaveBeenCalledWith(userId, 'workout');
      expect(exercises.assertAvailableToUser).not.toHaveBeenCalled();
      expect(repository.replaceOwned).not.toHaveBeenCalled();
    },
  );

  it('does not replace a workout with unavailable exercises', async () => {
    const { service, repository, exercises, dto } = setup();
    exercises.assertAvailableToUser.mockRejectedValue(
      new BadRequestException(),
    );
    await expect(
      service.update('owner', 'workout', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.replaceOwned).not.toHaveBeenCalled();
  });

  it('passes a complete replacement to the repository and reloads details', async () => {
    const { service, repository, exercises, dto } = setup();
    const result = await service.update('owner', 'workout', dto);
    expect(exercises.assertAvailableToUser).toHaveBeenCalledWith('owner', [
      'exercise',
    ]);
    expect(repository.replaceOwned).toHaveBeenCalledWith(
      'owner',
      'workout',
      expect.objectContaining({
        title: 'Chest',
        workoutDate: '2026-10-17',
        durationMinutes: 60,
        description: null,
        exercises: [expect.objectContaining({ position: 1 })],
      }),
    );
    expect(result.exercises[0].exercise).toEqual(exercise);
    expect(repository.findOwnedById).toHaveBeenCalledWith('owner', 'workout');
  });

  it('rejects adding to a foreign workout before fetching an exercise', async () => {
    const { service, repository, exercises, dto } = setup();
    repository.existsOwned.mockResolvedValue(false);
    await expect(
      service.addExercise('other', 'workout', dto.exercises[0]),
    ).rejects.toThrow(new NotFoundException('Workout not found'));
    expect(exercises.findOne).not.toHaveBeenCalled();
    expect(repository.appendExercise).not.toHaveBeenCalled();
  });

  it('does not append an unavailable exercise', async () => {
    const { service, repository, exercises, dto } = setup();
    exercises.findOne.mockRejectedValue(new NotFoundException());
    await expect(
      service.addExercise('owner', 'workout', dto.exercises[0]),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.appendExercise).not.toHaveBeenCalled();
  });

  it('lets the repository allocate the inclusion position', async () => {
    const { service, repository, exercises, dto } = setup();
    const result = await service.addExercise(
      'owner',
      'workout',
      dto.exercises[0],
    );
    expect(exercises.findOne).toHaveBeenCalledWith('owner', 'exercise');
    expect(repository.appendExercise).toHaveBeenCalledWith('owner', 'workout', {
      exerciseId: 'exercise',
      sets: [{ position: 1, weightKg: '50.00', reps: 10 }],
    });
    expect(result).toMatchObject({ id: 'inclusion', position: 1, exercise });
  });

  it('propagates the capacity check performed inside the transaction', async () => {
    const { service, repository, dto } = setup();
    repository.appendExercise.mockRejectedValue(new BadRequestException());
    await expect(
      service.addExercise('owner', 'workout', dto.exercises[0]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('passes both parent and inclusion IDs to transactional removal', async () => {
    const { service, repository } = setup();
    await service.removeExercise('owner', 'workout', 'inclusion');
    expect(repository.removeExercise).toHaveBeenCalledWith(
      'owner',
      'workout',
      'inclusion',
    );
  });

  it('scopes deletion to the owner and returns 404 if nothing was deleted', async () => {
    const { service, repository } = setup();
    repository.deleteOwned.mockResolvedValue(false);
    await expect(service.delete('admin', 'workout')).rejects.toThrow(
      new NotFoundException('Workout not found'),
    );
    expect(repository.deleteOwned).toHaveBeenCalledWith('admin', 'workout');
  });

  it('returns no data after successful deletion', async () => {
    const { service } = setup();
    await expect(service.delete('owner', 'workout')).resolves.toBeUndefined();
  });
  it('reloads the actual saved workout ID and returns current details', async () => {
    const { service, repository, dto, workout } = setup();
    repository.create.mockResolvedValue({ id: 'saved' });
    repository.findOwnedById.mockResolvedValue(
      Object.assign(new Workout(), workout, {
        id: 'saved',
        title: 'Persisted title',
      }),
    );
    const result = await service.create('owner', dto);
    expect(repository.findOwnedById).toHaveBeenCalledWith('owner', 'saved');
    expect(result).toMatchObject({ id: 'saved', title: 'Persisted title' });
  });

  it('supports empty workouts and empty lists', async () => {
    const { service, repository, exercises, workout, dto } = setup();
    repository.findMine.mockResolvedValue([]);
    await expect(service.findMine('owner')).resolves.toEqual([]);
    workout.exercises = [];
    exercises.getAvailableByIds.mockResolvedValue([]);
    await expect(
      service.create('owner', { ...dto, exercises: [] }),
    ).resolves.toMatchObject({ exercises: [] });
    expect(exercises.assertAvailableToUser).toHaveBeenCalledWith('owner', []);
    expect(exercises.getAvailableByIds).toHaveBeenCalledWith('owner', []);
  });

  it('propagates a transaction ownership failure without reloading details', async () => {
    const { service, repository, dto } = setup();
    repository.replaceOwned.mockRejectedValue(
      new NotFoundException('Workout not found'),
    );
    await expect(service.update('owner', 'workout', dto)).rejects.toThrow(
      new NotFoundException('Workout not found'),
    );
    expect(repository.findOwnedById).not.toHaveBeenCalled();
  });

  it('does not return incomplete details if catalog access fails', async () => {
    const { service, exercises } = setup();
    const error = new BadRequestException('Exercise unavailable');
    exercises.getAvailableByIds.mockRejectedValue(error);
    await expect(service.findOne('owner', 'workout')).rejects.toBe(error);
  });

  it('returns the removal promise so transaction failures reach the caller', async () => {
    const { service, repository } = setup();
    const error = new NotFoundException('Exercise not found in this workout');
    repository.removeExercise.mockRejectedValue(error);
    await expect(
      service.removeExercise('owner', 'workout', 'missing'),
    ).rejects.toBe(error);
  });
});

describe('workouts account cleanup delegation', () => {
  it('forwards the owner and transaction manager and propagates database failures', async () => {
    const { service, repository } = setup();
    const operation = vi.fn().mockResolvedValue(undefined);
    Object.assign(repository, { deleteAllForUser: operation });
    const manager = {} as EntityManager;
    await expect(
      service.deleteAllForUser('owner', manager),
    ).resolves.toBeUndefined();
    expect(operation).toHaveBeenCalledExactlyOnceWith('owner', manager);
    const error = new Error('Delete failed');
    operation.mockRejectedValue(error);
    await expect(service.deleteAllForUser('owner', manager)).rejects.toBe(
      error,
    );
  });
});
