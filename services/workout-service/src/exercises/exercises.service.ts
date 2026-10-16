import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { MuscleGroupsService } from '../muscle-groups/muscle-groups.service.js';

import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { UpdateExerciseDto } from './dto/update-exercise.dto.js';

import {
  Exercise,
  ExerciseVisibility,
} from './entities/exercise.entity.js';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exercises: Repository<Exercise>,

    private readonly muscleGroupsService: MuscleGroupsService,
  ) {}

  async findAvailable(userId: string) {
    const exercises = await this.exercises.find({
      where: [
        { ownerId: userId },
        { visibility: ExerciseVisibility.PUBLIC },
      ],
      order: {
        title: 'ASC',
        id: 'ASC',
      }
    });

    return this.toViews(exercises);
  }

  async findOne(userId: string, exerciseId: string) {
    const exercise = await this.exercises.findOne({
      where: [
        {
          id: exerciseId,
          ownerId: userId,
        },
        {
          id: exerciseId,
          visibility: ExerciseVisibility.PUBLIC,
        },
      ],
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found or unavailable');
    }

    const views = await this.toViews([exercise]);

    return views[0];
  }

  async create(
    userId: string,
    dto: CreateExerciseDto,
    isAdmin = false,
  ) {
    const visibility = dto.visibility ?? ExerciseVisibility.PRIVATE;

    this.checkVisibilityPermission(visibility, isAdmin);

    const groups = await this.muscleGroupsService.getByIds(
      dto.muscleGroups,
    );

    const exercise = this.exercises.create({
      ownerId: userId,
      title: dto.title.trim(),
      description: dto.description ?? null,
      equipment: dto.equipment ?? null,
      visibility,

      muscleGroups: groups.map((group) => ({
        id: group.id,
      })),
    });

    const saved = await this.exercises.save(exercise);

    return this.findOne(userId, saved.id);
  }

  async update(
    userId: string,
    exerciseId: string,
    dto: UpdateExerciseDto,
    isAdmin = false,
  ) {
    const exercise = await this.exercises.findOneBy({
      id: exerciseId,
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found or unavailable');
    }

    if (exercise.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to edit this exercise',
      );
    }

    const visibility = dto.visibility ?? exercise.visibility;

    if (visibility !== exercise.visibility) {
      this.checkVisibilityPermission(visibility, isAdmin);
    }

    const groups = await this.muscleGroupsService.getByIds(
      dto.muscleGroups,
    );

    const updated = this.exercises.create({
      id: exercise.id,
      ownerId: exercise.ownerId,
      title: dto.title.trim(),
      description: dto.description ?? null,
      equipment: dto.equipment ?? null,
      visibility,
      muscleGroups: groups.map((group) => ({
        id: group.id,
      })),
    });

    await this.exercises.save(updated);

    return this.findOne(userId, exerciseId);
  }

  async assertAvailableToUser(
    userId: string,
    exerciseIds: string[],
  ): Promise<void> {
    const ids = [...new Set(exerciseIds)];

    if (ids.length === 0) {
      return;
    }

    const count = await this.exercises.count({
      where: [
        {
          id: In(ids),
          ownerId: userId,
        },
        {
          id: In(ids),
          visibility: ExerciseVisibility.PUBLIC,
        },
      ],
    });

    if (count !== ids.length) {
      throw new BadRequestException(
        'One of the exercises does not exist or is unavailable',
      );
    }
  }

  async getAvailableByIds(
    userId: string,
    exerciseIds: string[],
  ) {
    const ids = [...new Set(exerciseIds)];

    if (ids.length === 0) {
      return [];
    }

    const exercises = await this.exercises.find({
      where: [
        {
          id: In(ids),
          ownerId: userId,
        },
        {
          id: In(ids),
          visibility: ExerciseVisibility.PUBLIC,
        },
      ],
    });

    if (exercises.length !== ids.length) {
      throw new BadRequestException(
        'One of the exercises does not exist or is unavailable',
      );
    }

    return this.toViews(exercises);
  }

  async delete(userId: string, exerciseId: string) {
    const exercise = await this.findOne(userId, exerciseId);

    if (!exercise) {
      throw new NotFoundException('Exercise not found or unavailable');
    }

    if (exercise.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this exercise',
      );
    }

    await this.exercises.delete(exerciseId);
  }

  private checkVisibilityPermission(
    visibility: ExerciseVisibility,
    isAdmin: boolean,
  ): void {
    if (visibility === ExerciseVisibility.PUBLIC && !isAdmin) {
      throw new ForbiddenException(
        'Public exercises can only be created by administrators',
      );
    }
  }

  private async toViews(exercises: Exercise[]) {
    const groupIds = [
      ...new Set(
        exercises.flatMap((exercise) => exercise.muscleGroupIds),
      ),
    ];

    const groups = await this.muscleGroupsService.getByIds(
      groupIds,
    );

    const groupById = new Map(
      groups.map((group) => [group.id, group]),
    );

    return exercises.map((exercise) => ({
      id: exercise.id,
      ownerId: exercise.ownerId,
      title: exercise.title,
      description: exercise.description,
      equipment: exercise.equipment,
      visibility: exercise.visibility,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,

      muscleGroups: exercise.muscleGroupIds.map(
        (id) => groupById.get(id),
      ),
    }));
  }
}