import type { EntityManager } from 'typeorm';
import { ILike, In, type Repository } from 'typeorm';
import { ExerciseScope, FindExerciseDto } from './dto/find-exercise.dto.js';
import { Exercise, ExerciseVisibility } from './entities/exercise.entity.js';
import { ExercisesRepository } from './exercises.repository.js';

function setup() {
  const exercise = Object.assign(new Exercise(), { id: 'exercise' });
  const orm = {
    findAndCount: vi.fn().mockResolvedValue([[exercise], 42]),
    findOneBy: vi.fn().mockResolvedValue(exercise),
    findOne: vi.fn().mockResolvedValue(exercise),
    find: vi.fn().mockResolvedValue([exercise]),
    count: vi.fn().mockResolvedValue(1),
    create: vi.fn().mockReturnValue(exercise),
    save: vi.fn().mockResolvedValue(exercise),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  return {
    repository: new ExercisesRepository(orm as unknown as Repository<Exercise>),
    orm,
    exercise,
  };
}

const relations = {
  relations: { muscleGroups: true },
  relationLoadStrategy: 'query',
};

describe('ExercisesRepository', () => {
  it.each([
    [ExerciseScope.MINE, [{ ownerId: 'owner' }]],
    [ExerciseScope.PUBLIC, [{ visibility: ExerciseVisibility.PUBLIC }]],
    [
      ExerciseScope.ALL,
      [{ ownerId: 'owner' }, { visibility: ExerciseVisibility.PUBLIC }],
    ],
  ])('scopes %s listings and uses stable pagination', async (scope, where) => {
    const { repository, orm, exercise } = setup();
    const query = Object.assign(new FindExerciseDto(), {
      scope,
      page: 3,
      limit: 7,
    });
    await expect(repository.findPageForUser('owner', query)).resolves.toEqual({
      items: [exercise],
      total: 42,
    });
    expect(orm.findAndCount).toHaveBeenCalledWith({
      where,
      ...relations,
      order: { title: 'ASC', id: 'ASC' },
      skip: 14,
      take: 7,
    });
  });

  it('applies search and muscle group filters to both visibility branches', async () => {
    const { repository, orm } = setup();
    const query = Object.assign(new FindExerciseDto(), {
      search: '  Squat  ',
      muscleGroupId: 'legs',
    });
    await repository.findPageForUser('owner', query);
    const filters = { title: ILike('%Squat%'), muscleGroups: { id: 'legs' } };
    expect(orm.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [
          { ...filters, ownerId: 'owner' },
          { ...filters, visibility: ExerciseVisibility.PUBLIC },
        ],
      }),
    );
  });

  it.each(['%', '_', String.fromCharCode(92)])(
    'escapes literal search character %s',
    async (character) => {
      const { repository, orm } = setup();
      await repository.findPageForUser(
        'owner',
        Object.assign(new FindExerciseDto(), { search: character }),
      );
      expect(orm.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            {
              ownerId: 'owner',
              title: ILike(`%${String.fromCharCode(92)}${character}%`),
            },
            {
              visibility: ExerciseVisibility.PUBLIC,
              title: ILike(`%${String.fromCharCode(92)}${character}%`),
            },
          ],
        }),
      );
    },
  );

  it('ignores whitespace-only searches and starts the first page at zero', async () => {
    const { repository, orm } = setup();
    await repository.findPageForUser(
      'owner',
      Object.assign(new FindExerciseDto(), { search: '   ' }),
    );
    expect(orm.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: [
          { ownerId: 'owner' },
          { visibility: ExerciseVisibility.PUBLIC },
        ],
        skip: 0,
        take: 20,
      }),
    );
  });

  it('loads an existing exercise by ID for ownership checks', async () => {
    const { repository, orm, exercise } = setup();
    await expect(repository.findById('exercise')).resolves.toBe(exercise);
    expect(orm.findOneBy).toHaveBeenCalledWith({ id: 'exercise' });
  });

  it('restricts detail lookup to owned or public exercises', async () => {
    const { repository, orm, exercise } = setup();
    await expect(
      repository.findAvailableById('owner', 'exercise'),
    ).resolves.toBe(exercise);
    expect(orm.findOne).toHaveBeenCalledWith({
      ...relations,
      where: [
        { id: 'exercise', ownerId: 'owner' },
        { id: 'exercise', visibility: ExerciseVisibility.PUBLIC },
      ],
    });
  });

  it('restricts bulk reads and counts to the requested IDs and visibility', async () => {
    const { repository, orm, exercise } = setup();
    const ids = ['one', 'two'];
    const where = [
      { id: In(ids), ownerId: 'owner' },
      { id: In(ids), visibility: ExerciseVisibility.PUBLIC },
    ];
    await expect(repository.findAvailableByIds('owner', ids)).resolves.toEqual([
      exercise,
    ]);
    await expect(repository.countAvailableByIds('owner', ids)).resolves.toBe(1);
    expect(orm.find).toHaveBeenCalledWith({ where, ...relations });
    expect(orm.count).toHaveBeenCalledWith({ where });
  });

  it('avoids database queries for empty ID lists', async () => {
    const { repository, orm } = setup();
    await expect(repository.findAvailableByIds('owner', [])).resolves.toEqual(
      [],
    );
    await expect(repository.countAvailableByIds('owner', [])).resolves.toBe(0);
    expect(orm.find).not.toHaveBeenCalled();
    expect(orm.count).not.toHaveBeenCalled();
  });

  it('saves all exercise fields with muscle group relation IDs', async () => {
    const { repository, orm, exercise } = setup();
    await expect(
      repository.save({
        id: 'exercise',
        ownerId: 'owner',
        title: 'Squat',
        description: 'Description',
        equipment: 'Barbell',
        visibility: ExerciseVisibility.PRIVATE,
        muscleGroupIds: ['legs', 'core'],
      }),
    ).resolves.toBe(exercise);
    expect(orm.create).toHaveBeenCalledWith({
      id: 'exercise',
      ownerId: 'owner',
      title: 'Squat',
      description: 'Description',
      equipment: 'Barbell',
      visibility: ExerciseVisibility.PRIVATE,
      muscleGroups: [{ id: 'legs' }, { id: 'core' }],
    });
    expect(orm.save).toHaveBeenCalledWith(exercise);
  });

  it('deletes only the requested exercise', async () => {
    const { repository, orm } = setup();
    await expect(repository.deleteById('exercise')).resolves.toBeUndefined();
    expect(orm.delete).toHaveBeenCalledWith('exercise');
  });
});

describe('exercises account cleanup persistence', () => {
  it('deletes only the requested owner data using the supplied transaction', async () => {
    const { repository, orm } = setup();
    const remove = vi.fn().mockResolvedValue({ affected: 0 });
    const manager = { delete: remove } as unknown as EntityManager;
    await expect(
      repository.deletePrivateForUser('owner', manager),
    ).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledExactlyOnceWith(Exercise, {
      ownerId: 'owner',
      visibility: ExerciseVisibility.PRIVATE,
    });
    expect(orm.delete).not.toHaveBeenCalled();
    const error = new Error('Delete failed');
    remove.mockRejectedValue(error);
    await expect(
      repository.deletePrivateForUser('owner', manager),
    ).rejects.toBe(error);
  });
});
