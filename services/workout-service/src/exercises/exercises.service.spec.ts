import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { MuscleGroupsService } from '../muscle-groups/muscle-groups.service.js';
import { FindExerciseDto } from './dto/find-exercise.dto.js';
import { Exercise, ExerciseVisibility } from './entities/exercise.entity.js';
import type { ExercisesRepository } from './exercises.repository.js';
import { ExercisesService } from './exercises.service.js';

function setup() {
  const exercise = Object.assign(new Exercise(), {
    id: 'exercise',
    ownerId: 'owner',
    title: 'Squat',
    description: null,
    equipment: null,
    visibility: ExerciseVisibility.PRIVATE,
    createdAt: new Date('2026-10-17T10:00:00Z'),
    updatedAt: new Date('2026-10-17T11:00:00Z'),
    muscleGroups: [],
    muscleGroupIds: [],
  });
  const repository = {
    findPageForUser: vi
      .fn()
      .mockResolvedValue({ items: [exercise], total: 25 }),
    findById: vi.fn().mockResolvedValue(exercise),
    findAvailableById: vi.fn().mockResolvedValue(exercise),
    findAvailableByIds: vi.fn().mockResolvedValue([exercise]),
    countAvailableByIds: vi.fn().mockResolvedValue(1),
    save: vi.fn().mockResolvedValue(exercise),
    deleteById: vi.fn().mockResolvedValue(undefined),
  };
  const groups = { getByIds: vi.fn().mockResolvedValue([]) };
  const service = new ExercisesService(
    repository as unknown as ExercisesRepository,
    groups as unknown as MuscleGroupsService,
  );
  const dto = { title: '  Squat  ', muscleGroups: ['legs'] };
  return { service, repository, groups, exercise, dto };
}

describe('ExercisesService', () => {
  it('returns mapped exercises and pagination for the requested user', async () => {
    const { service, repository } = setup();
    const query = Object.assign(new FindExerciseDto(), { page: 2, limit: 10 });
    const result = await service.findManyForUser('owner', query);
    expect(repository.findPageForUser).toHaveBeenCalledWith('owner', query);
    expect(result).toEqual({
      data: [expect.objectContaining({ id: 'exercise', title: 'Squat' })],
      meta: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    });
    expect(result.data[0]).not.toHaveProperty('muscleGroupIds');
  });

  it('returns an available exercise using a user-scoped lookup', async () => {
    const { service, repository } = setup();
    expect(await service.findOne('viewer', 'exercise')).toMatchObject({
      id: 'exercise',
    });
    expect(repository.findAvailableById).toHaveBeenCalledWith(
      'viewer',
      'exercise',
    );
  });

  it('returns 404 for a missing or unavailable exercise', async () => {
    const { service, repository } = setup();
    repository.findAvailableById.mockResolvedValue(null);
    await expect(service.findOne('viewer', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a private exercise by default and reloads the saved ID', async () => {
    const { service, repository, groups, dto } = setup();
    repository.save.mockResolvedValue({ id: 'saved' });
    await service.create('owner', dto);
    expect(groups.getByIds).toHaveBeenCalledWith(['legs']);
    expect(repository.save).toHaveBeenCalledWith({
      ownerId: 'owner',
      title: 'Squat',
      description: null,
      equipment: null,
      visibility: ExerciseVisibility.PRIVATE,
      muscleGroupIds: ['legs'],
    });
    expect(repository.findAvailableById).toHaveBeenCalledWith('owner', 'saved');
  });

  it('rejects public creation by a standard user before validation or saving', async () => {
    const { service, repository, groups, dto } = setup();
    await expect(
      service.create('owner', {
        ...dto,
        visibility: ExerciseVisibility.PUBLIC,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(groups.getByIds).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows administrators to create public exercises', async () => {
    const { service, repository, dto } = setup();
    await service.create(
      'admin',
      { ...dto, visibility: ExerciseVisibility.PUBLIC },
      true,
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'admin',
        visibility: ExerciseVisibility.PUBLIC,
      }),
    );
  });

  it.each(['create', 'update'] as const)(
    'does not save on invalid muscle groups during %s',
    async (method) => {
      const { service, repository, groups, dto } = setup();
      groups.getByIds.mockRejectedValue(
        new BadRequestException('Unknown muscle group'),
      );
      const result =
        method === 'create'
          ? service.create('owner', dto)
          : service.update('owner', 'exercise', dto);
      await expect(result).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    },
  );

  it('returns 404 before updating a missing exercise', async () => {
    const { service, repository, groups, dto } = setup();
    repository.findById.mockResolvedValue(null);
    await expect(
      service.update('owner', 'missing', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith('missing');
    expect(groups.getByIds).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'rejects updating another owner’s exercise (admin=%s)',
    async (isAdmin) => {
      const { service, repository, groups, dto } = setup();
      await expect(
        service.update('other', 'exercise', dto, isAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(groups.getByIds).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    },
  );

  it('preserves existing public visibility when the owner omits it', async () => {
    const { service, repository, exercise, dto } = setup();
    exercise.visibility = ExerciseVisibility.PUBLIC;
    await service.update('owner', 'exercise', dto);
    expect(repository.findById).toHaveBeenCalledWith('exercise');
    expect(repository.save).toHaveBeenCalledWith({
      id: 'exercise',
      ownerId: 'owner',
      title: 'Squat',
      description: null,
      equipment: null,
      visibility: ExerciseVisibility.PUBLIC,
      muscleGroupIds: ['legs'],
    });
    expect(repository.findAvailableById).toHaveBeenCalledWith(
      'owner',
      'exercise',
    );
  });

  it('prevents standard users from publishing a private exercise', async () => {
    const { service, repository, dto } = setup();
    await expect(
      service.update('owner', 'exercise', {
        ...dto,
        visibility: ExerciseVisibility.PUBLIC,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows an administrator to publish their own exercise', async () => {
    const { service, repository, dto } = setup();
    await service.update(
      'owner',
      'exercise',
      { ...dto, visibility: ExerciseVisibility.PUBLIC },
      true,
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: ExerciseVisibility.PUBLIC }),
    );
  });

  it('allows the owner to make a public exercise private', async () => {
    const { service, repository, exercise, dto } = setup();
    exercise.visibility = ExerciseVisibility.PUBLIC;
    await service.update('owner', 'exercise', {
      ...dto,
      visibility: ExerciseVisibility.PRIVATE,
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: ExerciseVisibility.PRIVATE }),
    );
  });

  it('deletes an owned exercise', async () => {
    const { service, repository } = setup();
    await expect(service.delete('owner', 'exercise')).resolves.toBeUndefined();
    expect(repository.findAvailableById).toHaveBeenCalledWith(
      'owner',
      'exercise',
    );
    expect(repository.deleteById).toHaveBeenCalledWith('exercise');
  });

  it('does not delete another owner’s public exercise', async () => {
    const { service, repository, exercise } = setup();
    exercise.visibility = ExerciseVisibility.PUBLIC;
    await expect(service.delete('admin', 'exercise')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.deleteById).not.toHaveBeenCalled();
  });

  it('does not delete an unavailable exercise', async () => {
    const { service, repository } = setup();
    repository.findAvailableById.mockResolvedValue(null);
    await expect(service.delete('owner', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.deleteById).not.toHaveBeenCalled();
  });

  it('accepts empty ID lists without querying the repository', async () => {
    const { service, repository } = setup();
    await expect(
      service.assertAvailableToUser('owner', []),
    ).resolves.toBeUndefined();
    await expect(service.getAvailableByIds('owner', [])).resolves.toEqual([]);
    expect(repository.countAvailableByIds).not.toHaveBeenCalled();
    expect(repository.findAvailableByIds).not.toHaveBeenCalled();
  });

  it('deduplicates IDs when checking and loading exercises', async () => {
    const { service, repository } = setup();
    await expect(
      service.assertAvailableToUser('owner', ['exercise', 'exercise']),
    ).resolves.toBeUndefined();
    const result = await service.getAvailableByIds('owner', [
      'exercise',
      'exercise',
    ]);
    expect(repository.countAvailableByIds).toHaveBeenCalledWith('owner', [
      'exercise',
    ]);
    expect(repository.findAvailableByIds).toHaveBeenCalledWith('owner', [
      'exercise',
    ]);
    expect(result).toEqual([expect.objectContaining({ id: 'exercise' })]);
    expect(result[0]).not.toHaveProperty('muscleGroupIds');
  });

  it('rejects a list containing an unavailable ID', async () => {
    const { service } = setup();
    await expect(
      service.assertAvailableToUser('owner', ['exercise', 'missing']),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.getAvailableByIds('owner', ['exercise', 'missing']),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
