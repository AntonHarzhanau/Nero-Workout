import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ExercisesService } from '../exercises/exercises.service.js';
import { ExerciseVisibility } from '../exercises/entities/exercise.entity.js';
import type { ExerciseView } from '../exercises/exercise.types.js';
import { PlanExercise } from './entities/plan-exercise.entity.js';
import { PlanSet } from './entities/plan-set.entity.js';
import { Plan } from './entities/plan.entity.js';
import type { PlansRepository } from './plans.repository.js';
import { PlansService } from './plans.service.js';

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
  const item = Object.assign(new PlanExercise(), {
    id: 'inclusion',
    planId: 'plan',
    exerciseId: exercise.id,
    position: 1,
    sets: [
      Object.assign(new PlanSet(), {
        id: 'set',
        position: 1,
        weightKg: '50.00',
        reps: 10,
      }),
    ],
  });
  const plan = Object.assign(new Plan(), {
    id: 'plan',
    ownerId: 'owner',
    title: 'Chest',
    description: null,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
    planExercises: [item],
  });
  const repository = {
    findMine: vi.fn().mockResolvedValue([plan]),
    findOwnedById: vi.fn().mockResolvedValue(plan),
    existsOwned: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(plan),
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
  const service = new PlansService(
    repository as unknown as PlansRepository,
    exercises as unknown as ExercisesService,
  );
  const dto = {
    title: '  Chest  ',
    exercises: [
      { exerciseId: exercise.id, sets: [{ weightKg: 50, reps: 10 }] },
    ],
  };
  return { service, repository, exercises, plan, item, dto };
}

describe('PlansService', () => {
  it('returns summaries without fetching catalog data', async () => {
    const { service, repository, exercises } = setup();
    const result = await service.findMine('owner');
    expect(repository.findMine).toHaveBeenCalledWith('owner');
    expect(result[0]).not.toHaveProperty('planExercises');
    expect(result[0]).not.toHaveProperty('exercises');
    expect(exercises.getAvailableByIds).not.toHaveBeenCalled();
  });

  it('loads current exercise data through ExercisesService for details', async () => {
    const { service, repository, exercises } = setup();
    const result = await service.findOne('owner', 'plan');
    expect(repository.findOwnedById).toHaveBeenCalledWith('owner', 'plan');
    expect(exercises.getAvailableByIds).toHaveBeenCalledWith('owner', [
      'exercise',
    ]);
    expect(result.exercises[0]).toMatchObject({
      id: 'inclusion',
      exercise,
      sets: [{ weightKg: '50.00', reps: 10 }],
    });
  });

  it('rejects missing or foreign plans before loading exercises', async () => {
    const { service, repository, exercises } = setup();
    repository.findOwnedById.mockResolvedValue(null);
    await expect(service.findOne('other', 'plan')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(exercises.getAvailableByIds).not.toHaveBeenCalled();
  });

  it('rejects unavailable exercises before creating a plan', async () => {
    const { service, repository, exercises, dto } = setup();
    exercises.assertAvailableToUser.mockRejectedValue(
      new BadRequestException(),
    );
    await expect(service.create('owner', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('normalizes nested input before saving and returns plan details', async () => {
    const { service, repository, exercises, dto } = setup();
    const result = await service.create('owner', dto);
    expect(exercises.assertAvailableToUser).toHaveBeenCalledWith('owner', [
      'exercise',
    ]);
    expect(repository.create).toHaveBeenCalledWith('owner', {
      title: 'Chest',
      description: null,
      exercises: [
        {
          exerciseId: 'exercise',
          position: 1,
          sets: [{ position: 1, weightKg: '50.00', reps: 10 }],
        },
      ],
    });
    expect(result.id).toBe('plan');
  });

  it.each(['other', 'admin'])(
    'prevents %s from replacing another owner’s plan',
    async (userId) => {
      const { service, repository, exercises, dto } = setup();
      repository.existsOwned.mockResolvedValue(false);
      await expect(service.update(userId, 'plan', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.existsOwned).toHaveBeenCalledWith(userId, 'plan');
      expect(exercises.assertAvailableToUser).not.toHaveBeenCalled();
      expect(repository.replaceOwned).not.toHaveBeenCalled();
    },
  );

  it('does not replace a plan with unavailable exercises', async () => {
    const { service, repository, exercises, dto } = setup();
    exercises.assertAvailableToUser.mockRejectedValue(
      new BadRequestException(),
    );
    await expect(service.update('owner', 'plan', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.replaceOwned).not.toHaveBeenCalled();
  });

  it('passes a complete replacement to the repository and reloads details', async () => {
    const { service, repository, dto } = setup();
    const result = await service.update('owner', 'plan', dto);
    expect(repository.replaceOwned).toHaveBeenCalledWith(
      'owner',
      'plan',
      expect.objectContaining({
        title: 'Chest',
        exercises: [expect.objectContaining({ position: 1 })],
      }),
    );
    expect(result.exercises[0].exercise).toEqual(exercise);
  });

  it('rejects adding to a foreign plan before fetching an exercise', async () => {
    const { service, repository, exercises, dto } = setup();
    repository.existsOwned.mockResolvedValue(false);
    await expect(
      service.addExercise('other', 'plan', dto.exercises[0]),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(exercises.findOne).not.toHaveBeenCalled();
    expect(repository.appendExercise).not.toHaveBeenCalled();
  });

  it('does not append an unavailable exercise', async () => {
    const { service, repository, exercises, dto } = setup();
    exercises.findOne.mockRejectedValue(new NotFoundException());
    await expect(
      service.addExercise('owner', 'plan', dto.exercises[0]),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.appendExercise).not.toHaveBeenCalled();
  });

  it('lets the repository allocate the inclusion position', async () => {
    const { service, repository, dto } = setup();
    const result = await service.addExercise('owner', 'plan', dto.exercises[0]);
    expect(repository.appendExercise).toHaveBeenCalledWith('owner', 'plan', {
      exerciseId: 'exercise',
      sets: [{ position: 1, weightKg: '50.00', reps: 10 }],
    });
    expect(result).toMatchObject({ id: 'inclusion', position: 1, exercise });
  });

  it('propagates the capacity check performed inside the transaction', async () => {
    const { service, repository, dto } = setup();
    repository.appendExercise.mockRejectedValue(new BadRequestException());
    await expect(
      service.addExercise('owner', 'plan', dto.exercises[0]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('passes both parent and inclusion IDs to transactional removal', async () => {
    const { service, repository } = setup();
    await service.removeExercise('owner', 'plan', 'inclusion');
    expect(repository.removeExercise).toHaveBeenCalledWith(
      'owner',
      'plan',
      'inclusion',
    );
  });

  it('scopes deletion to the owner and returns 404 if nothing was deleted', async () => {
    const { service, repository } = setup();
    repository.deleteOwned.mockResolvedValue(false);
    await expect(service.delete('admin', 'plan')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.deleteOwned).toHaveBeenCalledWith('admin', 'plan');
  });

  it('returns no data after successful deletion', async () => {
    const { service } = setup();
    await expect(service.delete('owner', 'plan')).resolves.toBeUndefined();
  });
});
