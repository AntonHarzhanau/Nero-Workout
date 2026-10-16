import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, EntityManager, Repository } from 'typeorm';

import { ExercisesService } from '../exercises/exercises.service.js';

import {
  CreateWorkoutDto,
  WorkoutExerciseInputDto,
} from './dto/create-workout.dto.js';

import { UpdateWorkoutDto } from './dto/update-workout.dto.js';
import { AddWorkoutExerciseDto } from './dto/add-workout-exercise.dto.js';

import { Workout } from './entities/workout.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(Workout)
    private readonly workouts: Repository<Workout>,

    private readonly exercisesService: ExercisesService,
    private readonly dataSource: DataSource,
  ) {}

  findMine(userId: string) {
    return this.workouts.find({
      where: {
        ownerId: userId,
      },
      order: {
        workoutDate: 'DESC',
        createdAt: 'DESC',
        id: 'DESC',
      },
    });
  }

  async findOne(userId: string, workoutId: string) {
    const workout = await this.workouts.findOne({
      where: {
        id: workoutId,
        ownerId: userId,
      },
      relations: {
        exercises: {
          sets: true,
        },
      },
      order: {
        exercises: {
          position: 'ASC',
          sets: {
            position: 'ASC',
          },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return this.toView(userId, workout);
  }

  async create(userId: string, dto: CreateWorkoutDto) {
    await this.exercisesService.assertAvailableToUser(
      userId,
      dto.exercises.map((item) => item.exerciseId),
    );

    const workout = this.workouts.create({
      ownerId: userId,
      title: dto.title.trim(),
      description: dto.description ?? null,
      workoutDate: dto.workoutDate,
      durationMinutes: dto.durationMinutes ?? null,

      exercises: dto.exercises.map((item, index) =>
        this.buildExercise(item, index + 1),
      ),
    });

    const saved = await this.workouts.save(workout);

    return this.findOne(userId, saved.id);
  }

  async update(userId: string, workoutId: string, dto: UpdateWorkoutDto) {
    await this.assertOwned(userId, workoutId);

    await this.exercisesService.assertAvailableToUser(
      userId,
      dto.exercises.map((item) => item.exerciseId),
    );

    await this.dataSource.transaction(async (manager) => {
      const workout = await this.lockOwnedWorkout(manager, userId, workoutId);

      await manager.getRepository(WorkoutExercise).delete({
        workoutId,
      });

      const repository = manager.getRepository(Workout);

      const updated = repository.create({
        id: workout.id,
        ownerId: workout.ownerId,
        title: dto.title.trim(),
        description: dto.description ?? null,
        workoutDate: dto.workoutDate,
        durationMinutes: dto.durationMinutes ?? null,
        updatedAt: new Date(),

        exercises: dto.exercises.map((item, index) =>
          this.buildExercise(item, index + 1),
        ),
      });

      await repository.save(updated);
    });

    return this.findOne(userId, workoutId);
  }

  async addExercise(
    userId: string,
    workoutId: string,
    dto: AddWorkoutExerciseDto,
  ) {
    await this.assertOwned(userId, workoutId);

    const exercise = await this.exercisesService.findOne(
      userId,
      dto.exerciseId,
    );

    const saved = await this.dataSource.transaction(async (manager) => {
      await this.lockOwnedWorkout(manager, userId, workoutId);

      const repository = manager.getRepository(WorkoutExercise);

      const count = await repository.countBy({
        workoutId,
      });

      if (count >= 100) {
        throw new BadRequestException(
          'A workout cannot contain more than 100 exercises',
        );
      }

      const last = await repository.findOne({
        where: {
          workoutId,
        },
        order: {
          position: 'DESC',
        },
      });

      const position = (last?.position ?? 0) + 1;

      const item = repository.create({
        workoutId,
        ...this.buildExercise(dto, position),
      });

      const result = await repository.save(item);

      await manager
        .getRepository(Workout)
        .update({ id: workoutId }, { updatedAt: new Date() });

      return result;
    });

    return {
      id: saved.id,
      exerciseId: saved.exerciseId,
      position: saved.position,
      exercise,

      sets: saved.sets.map((set) => ({
        id: set.id,
        position: set.position,
        weightKg: set.weightKg,
        reps: set.reps,
      })),
    };
  }

  async removeExercise(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.lockOwnedWorkout(manager, userId, workoutId);

      const result = await manager.getRepository(WorkoutExercise).delete({
        id: workoutExerciseId,
        workoutId,
      });

      if (!result.affected) {
        throw new NotFoundException('Exercise not found in this workout');
      }

      await manager
        .getRepository(Workout)
        .update({ id: workoutId }, { updatedAt: new Date() });
    });
  }

  async delete(userId: string, workoutId: string): Promise<void> {
    const result = await this.workouts.delete({
      id: workoutId,
      ownerId: userId,
    });

    if (!result.affected) {
      throw new NotFoundException('Workout not found');
    }
  }

  private buildExercise(input: WorkoutExerciseInputDto, position: number) {
    return {
      exerciseId: input.exerciseId,
      position,

      sets: input.sets.map((set, index) => ({
        position: index + 1,
        weightKg: set.weightKg.toFixed(2),
        reps: set.reps,
      })),
    };
  }

  private async assertOwned(userId: string, workoutId: string): Promise<void> {
    const exists = await this.workouts.existsBy({
      id: workoutId,
      ownerId: userId,
    });

    if (!exists) {
      throw new NotFoundException('Workout not found');
    }
  }

  private async lockOwnedWorkout(
    manager: EntityManager,
    userId: string,
    workoutId: string,
  ): Promise<Workout> {
    const workout = await manager.getRepository(Workout).findOne({
      where: {
        id: workoutId,
        ownerId: userId,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return workout;
  }

  private async toView(userId: string, workout: Workout) {
    const exercises = await this.exercisesService.getAvailableByIds(
      userId,
      workout.exercises.map((item) => item.exerciseId),
    );

    const exerciseById = new Map(
      exercises.map((exercise) => [exercise.id, exercise]),
    );

    return {
      id: workout.id,
      ownerId: workout.ownerId,
      title: workout.title,
      description: workout.description,
      workoutDate: workout.workoutDate,
      durationMinutes: workout.durationMinutes,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,

      exercises: workout.exercises.map((item) => ({
        id: item.id,
        exerciseId: item.exerciseId,
        position: item.position,
        exercise: exerciseById.get(item.exerciseId)!,

        sets: item.sets.map((set) => ({
          id: set.id,
          position: set.position,
          weightKg: set.weightKg,
          reps: set.reps,
        })),
      })),
    };
  }
}
