import { BadRequestException } from '@nestjs/common';
import { In, type Repository } from 'typeorm';
import { MuscleGroup } from './entities/muscle-group.entity.js';
import { DEFAULT_MUSCLE_GROUPS } from './muscle-groups.data.js';
import { MuscleGroupsService } from './muscle-groups.service.js';

function setup() {
  const query = {
    insert: vi.fn().mockReturnThis(),
    into: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    orIgnore: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(undefined),
  };
  const orm = {
    createQueryBuilder: vi.fn(() => query),
    find: vi.fn().mockResolvedValue([]),
  };
  const service = new MuscleGroupsService(
    orm as unknown as Repository<MuscleGroup>,
  );
  return { service, orm, query };
}

describe('MuscleGroupsService', () => {
  it('seeds catalog entries without replacing existing groups and waits for insertion', async () => {
    const { service, query } = setup();
    await service.onApplicationBootstrap();
    expect(query.insert).toHaveBeenCalledOnce();
    expect(query.into).toHaveBeenCalledExactlyOnceWith(MuscleGroup);
    expect(query.values).toHaveBeenCalledExactlyOnceWith(DEFAULT_MUSCLE_GROUPS);
    expect(query.orIgnore).toHaveBeenCalledOnce();
    expect(query.execute).toHaveBeenCalledOnce();
    const error = new Error('Seed failed');
    query.execute.mockRejectedValue(error);
    await expect(service.onApplicationBootstrap()).rejects.toBe(error);
  });

  it('returns groups alphabetically', async () => {
    const { service, orm } = setup();
    const groups = [{ id: 'legs', code: 'legs', name: 'Legs' }];
    orm.find.mockResolvedValue(groups);
    await expect(service.findAll()).resolves.toBe(groups);
    expect(orm.find).toHaveBeenCalledExactlyOnceWith({
      order: { name: 'ASC' },
    });
  });

  it('does not query for an empty selection', async () => {
    const { service, orm } = setup();
    await expect(service.getByIds([])).resolves.toEqual([]);
    expect(orm.find).not.toHaveBeenCalled();
  });

  it('deduplicates requested IDs and returns only public group fields', async () => {
    const { service, orm } = setup();
    orm.find.mockResolvedValue([
      { id: 'legs', code: 'legs', name: 'Legs', exercises: ['private'] },
    ]);
    await expect(service.getByIds(['legs', 'legs'])).resolves.toEqual([
      { id: 'legs', code: 'legs', name: 'Legs' },
    ]);
    expect(orm.find).toHaveBeenCalledExactlyOnceWith({
      where: { id: In(['legs']) },
    });
  });

  it('rejects a selection containing missing groups', async () => {
    const { service, orm } = setup();
    orm.find.mockResolvedValue([{ id: 'legs' }]);
    await expect(service.getByIds(['legs', 'missing'])).rejects.toThrow(
      new BadRequestException('Some muscle groups not found'),
    );
  });
});
