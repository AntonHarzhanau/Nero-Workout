import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { ExerciseScope, FindExerciseDto } from './dto/find-exercise.dto.js';
import { Exercise, ExerciseVisibility } from './entities/exercise.entity.js';
import type { SaveExerciseInput } from './exercise.types.js';

@Injectable()
export class ExercisesRepository {
  constructor(
    @InjectRepository(Exercise)
    private readonly repository: Repository<Exercise>,
  ) {}

  async findPageForUser(
    userId: string,
    query: FindExerciseDto,
  ): Promise<{ items: Exercise[]; total: number }> {
    const filters = this.buildFilters(query);

    const where = this.buildScopeWhere(userId, query.scope, filters);

    const [items, total] = await this.repository.findAndCount({
      where,
      relations: { muscleGroups: true },
      relationLoadStrategy: 'query',
      order: {
        title: 'ASC',
        id: 'ASC',
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return { items, total };
  }

  findById(id: string): Promise<Exercise | null> {
    return this.repository.findOneBy({ id });
  }

  findAvailableById(userId: string, id: string): Promise<Exercise | null> {
    return this.repository.findOne({
      where: this.availableWhere(userId, { id }),
      relations: { muscleGroups: true },
      relationLoadStrategy: 'query',
    });
  }

  async findAvailableByIds(userId: string, ids: string[]): Promise<Exercise[]> {
    if (ids.length === 0) return [];

    return this.repository.find({
      where: this.availableWhere(userId, { id: In(ids) }),
      relations: { muscleGroups: true },
      relationLoadStrategy: 'query',
    });
  }

  async countAvailableByIds(userId: string, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    return this.repository.count({
      where: this.availableWhere(userId, { id: In(ids) }),
    });
  }

  async save(input: SaveExerciseInput): Promise<Exercise> {
    const exercise = this.repository.create({
      id: input.id,
      ownerId: input.ownerId,
      title: input.title,
      description: input.description,
      equipment: input.equipment,
      visibility: input.visibility,

      muscleGroups: input.muscleGroupIds.map((id) => ({
        id,
      })),
    });

    return this.repository.save(exercise);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private buildFilters(query: FindExerciseDto): FindOptionsWhere<Exercise> {
    const filters: FindOptionsWhere<Exercise> = {};

    const title = query.search?.trim();

    if (title) {
      const escapedTitle = title.replace(/[\\%_]/g, '\\$&');

      filters.title = ILike(`%${escapedTitle}%`);
    }

    if (query.muscleGroupId) {
      filters.muscleGroups = { id: query.muscleGroupId };
    }

    return filters;
  }

  private buildScopeWhere(
    userId: string,
    scope: ExerciseScope,
    filters: FindOptionsWhere<Exercise>,
  ): FindOptionsWhere<Exercise>[] {
    switch (scope) {
      case ExerciseScope.MINE:
        return [{ ...filters, ownerId: userId }];

      case ExerciseScope.PUBLIC:
        return [{ ...filters, visibility: ExerciseVisibility.PUBLIC }];

      case ExerciseScope.ALL:
      default:
        return this.availableWhere(userId, filters);
    }
  }

  private availableWhere(
    userId: string,
    filters: FindOptionsWhere<Exercise>,
  ): FindOptionsWhere<Exercise>[] {
    return [
      { ...filters, ownerId: userId },
      { ...filters, visibility: ExerciseVisibility.PUBLIC },
    ];
  }
}
