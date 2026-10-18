import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MuscleGroupsService } from '../muscle-groups/muscle-groups.service.js';
import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { FindExerciseDto } from './dto/find-exercise.dto.js';
import { UpdateExerciseDto } from './dto/update-exercise.dto.js';
import { Exercise, ExerciseVisibility } from './entities/exercise.entity.js';
import { toExerciseValues, toExerciseView } from './exercise.mapper.js';
import {
  assertCanManageExercise,
  assertCanSetVisibility,
} from './exercise.policy.js';
import type { ExerciseView } from './exercise.types.js';
import { ExercisesRepository } from './exercises.repository.js';
import {
  type PaginatedResult,
  createPaginatedResult,
} from '../common/pagination.js';
import type { EntityManager } from 'typeorm';

@Injectable()
export class ExercisesService {
  constructor(
    private readonly exercisesRepository: ExercisesRepository,
    private readonly muscleGroupsService: MuscleGroupsService,
  ) {}

  async findManyForUser(
    userId: string,
    query: FindExerciseDto,
  ): Promise<PaginatedResult<ExerciseView>> {
    const { items, total } = await this.exercisesRepository.findPageForUser(
      userId,
      query,
    );

    return createPaginatedResult(
      items.map(toExerciseView),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(userId: string, exerciseId: string): Promise<ExerciseView> {
    const exercise = await this.requireAvailableExercise(userId, exerciseId);

    return toExerciseView(exercise);
  }

  async create(
    userId: string,
    dto: CreateExerciseDto,
    isAdmin = false,
  ): Promise<ExerciseView> {
    const visibility = dto.visibility ?? ExerciseVisibility.PRIVATE;

    assertCanSetVisibility(visibility, isAdmin);

    await this.muscleGroupsService.getByIds(dto.muscleGroups);

    const saved = await this.exercisesRepository.save({
      ownerId: userId,
      ...toExerciseValues(dto, visibility),
    });

    return this.findOne(userId, saved.id);
  }

  async update(
    userId: string,
    exerciseId: string,
    dto: UpdateExerciseDto,
    isAdmin = false,
  ): Promise<ExerciseView> {
    const exercise = await this.requireExistingExercise(exerciseId);

    assertCanManageExercise(userId, exercise);

    const visibility = dto.visibility ?? exercise.visibility;

    if (visibility !== exercise.visibility) {
      assertCanSetVisibility(visibility, isAdmin);
    }

    await this.muscleGroupsService.getByIds(dto.muscleGroups);

    await this.exercisesRepository.save({
      id: exercise.id,
      ownerId: exercise.ownerId,
      ...toExerciseValues(dto, visibility),
    });

    return this.findOne(userId, exercise.id);
  }

  async delete(userId: string, exerciseId: string): Promise<void> {
    const exercise = await this.requireAvailableExercise(userId, exerciseId);

    assertCanManageExercise(userId, exercise);

    await this.exercisesRepository.deleteById(exercise.id);
  }

  async assertAvailableToUser(
    userId: string,
    exerciseIds: string[],
  ): Promise<void> {
    const ids = [...new Set(exerciseIds)];

    if (ids.length === 0) {
      return;
    }

    const count = await this.exercisesRepository.countAvailableByIds(
      userId,
      ids,
    );

    if (count !== ids.length) {
      throw new BadRequestException(
        'One of the exercises does not exist or is unavailable',
      );
    }
  }

  async getAvailableByIds(
    userId: string,
    exerciseIds: string[],
  ): Promise<ExerciseView[]> {
    const ids = [...new Set(exerciseIds)];

    if (ids.length === 0) {
      return [];
    }

    const exercises = await this.exercisesRepository.findAvailableByIds(
      userId,
      ids,
    );

    if (exercises.length !== ids.length) {
      throw new BadRequestException(
        'One of the exercises does not exist or is unavailable',
      );
    }

    return exercises.map(toExerciseView);
  }

  async deletePrivateForUser(
    userId: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.exercisesRepository.deletePrivateForUser(userId, manager);
  }

  private async requireExistingExercise(exerciseId: string): Promise<Exercise> {
    const exercise = await this.exercisesRepository.findById(exerciseId);

    if (!exercise) {
      throw new NotFoundException('Exercise not found or unavailable');
    }

    return exercise;
  }

  private async requireAvailableExercise(
    userId: string,
    exerciseId: string,
  ): Promise<Exercise> {
    const exercise = await this.exercisesRepository.findAvailableById(
      userId,
      exerciseId,
    );

    if (!exercise) {
      throw new NotFoundException('Exercise not found or unavailable');
    }

    return exercise;
  }
}
