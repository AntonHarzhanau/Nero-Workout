import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';

import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { Workout } from './entities/workout.entity.js';
import { assertCanAddWorkoutExercise } from './workout.policy.js';
import type {
  WorkoutExerciseValues,
  WorkoutSummary,
  WorkoutValues,
} from './workout.types.js';

@Injectable()
export class WorkoutsRepository {
  constructor(
    @InjectRepository(Workout)
    private readonly repository: Repository<Workout>,
    private readonly dataSource: DataSource,
  ) {}

  findMine(userId: string): Promise<WorkoutSummary[]> {
    return this.repository.find({
      select: {
        id: true,
        ownerId: true,
        title: true,
        workoutDate: true,
        durationMinutes: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { ownerId: userId },
      order: { workoutDate: 'DESC', createdAt: 'DESC', id: 'DESC' },
    });
  }

  findOwnedById(userId: string, workoutId: string): Promise<Workout | null> {
    return this.repository.findOne({
      where: { id: workoutId, ownerId: userId },
      relations: { exercises: { sets: true } },
      order: {
        exercises: {
          position: 'ASC',
          sets: { position: 'ASC' },
        },
      },
    });
  }

  existsOwned(userId: string, workoutId: string): Promise<boolean> {
    return this.repository.existsBy({ id: workoutId, ownerId: userId });
  }

  create(userId: string, values: WorkoutValues): Promise<Workout> {
    const workout = this.repository.create({
      ownerId: userId,
      title: values.title,
      workoutDate: values.workoutDate,
      durationMinutes: values.durationMinutes,
      description: values.description,
      exercises: values.exercises,
    });

    return this.repository.save(workout);
  }

  async replaceOwned(
    userId: string,
    workoutId: string,
    values: WorkoutValues,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const workout = await this.lockOwnedWorkout(manager, userId, workoutId);

      await manager.getRepository(WorkoutExercise).delete({ workoutId });

      const repository = manager.getRepository(Workout);
      const updated = repository.create({
        id: workout.id,
        ownerId: workout.ownerId,
        title: values.title,
        workoutDate: values.workoutDate,
        durationMinutes: values.durationMinutes,
        description: values.description,
        updatedAt: new Date(),
        exercises: values.exercises,
      });

      await repository.save(updated);
    });
  }

  appendExercise(
    userId: string,
    workoutId: string,
    values: WorkoutExerciseValues,
  ): Promise<WorkoutExercise> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockOwnedWorkout(manager, userId, workoutId);

      const repository = manager.getRepository(WorkoutExercise);
      const count = await repository.countBy({ workoutId });

      // The capacity check and position allocation share the parent row lock.
      assertCanAddWorkoutExercise(count);

      const last = await repository.findOne({
        where: { workoutId },
        order: { position: 'DESC' },
      });

      const item = repository.create({
        workoutId,
        ...values,
        position: (last?.position ?? 0) + 1,
      });

      const saved = await repository.save(item);

      await this.touchWorkout(manager, workoutId);

      return saved;
    });
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

      await this.touchWorkout(manager, workoutId);
    });
  }

  async deleteOwned(userId: string, workoutId: string): Promise<boolean> {
    const result = await this.repository.delete({
      id: workoutId,
      ownerId: userId,
    });

    return Boolean(result.affected);
  }

  private async lockOwnedWorkout(
    manager: EntityManager,
    userId: string,
    workoutId: string,
  ): Promise<Workout> {
    const workout = await manager.getRepository(Workout).findOne({
      where: { id: workoutId, ownerId: userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return workout;
  }

  private async touchWorkout(
    manager: EntityManager,
    workoutId: string,
  ): Promise<void> {
    await manager
      .getRepository(Workout)
      .update({ id: workoutId }, { updatedAt: new Date() });
  }
}
