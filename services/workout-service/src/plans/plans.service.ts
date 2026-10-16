import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  EntityManager,
  Repository,
} from 'typeorm';

import { ExercisesService } from '../exercises/exercises.service.js';

import {
  CreatePlanDto,
  PlanExerciseInputDto,
} from './dto/create-plan.dto.js';

import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { AddPlanExerciseDto } from './dto/add-plan-exercise.dto.js';

import { Plan } from './entities/plan.entity.js';
import { PlanExercise } from './entities/plan-exercise.entity.js';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly plans: Repository<Plan>,

    private readonly exercisesService: ExercisesService,
    private readonly dataSource: DataSource,
  ) {}

  findMine(userId: string) {
    return this.plans.find({
      where: {
        ownerId: userId,
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    });
  }

  async findOne(userId: string, planId: string) {
    const plan = await this.plans.findOne({
      where: {
        id: planId,
        ownerId: userId,
      },
      relations: {
        planExercises: {
          sets: true,
        },
      },
      order: {
        planExercises: {
          position: 'ASC',
          sets: {
            position: 'ASC',
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return this.toView(userId, plan);
  }

  async create(userId: string, dto: CreatePlanDto) {
    await this.exercisesService.assertAvailableToUser(
      userId,
      dto.exercises.map((item) => item.exerciseId),
    );

    const plan = this.plans.create({
      ownerId: userId,
      title: dto.title.trim(),
      description: dto.description ?? null,

      planExercises: dto.exercises.map((item, index) =>
        this.buildExercise(item, index + 1),
      ),
    });

    const saved = await this.plans.save(plan);

    return this.findOne(userId, saved.id);
  }

  async update(
    userId: string,
    planId: string,
    dto: UpdatePlanDto,
  ) {
    await this.assertOwned(userId, planId);

    await this.exercisesService.assertAvailableToUser(
      userId,
      dto.exercises.map((item) => item.exerciseId),
    );

    await this.dataSource.transaction(async (manager) => {
      const plan = await this.lockOwnedPlan(
        manager,
        userId,
        planId,
      );

      await manager.getRepository(PlanExercise).delete({
        planId,
      });

      const repository = manager.getRepository(Plan);

      const updated = repository.create({
        id: plan.id,
        ownerId: plan.ownerId,
        title: dto.title.trim(),
        description: dto.description ?? null,
        updatedAt: new Date(),

        planExercises: dto.exercises.map((item, index) =>
          this.buildExercise(item, index + 1),
        ),
      });

      await repository.save(updated);
    });

    return this.findOne(userId, planId);
  }

  async addExercise(
    userId: string,
    planId: string,
    dto: AddPlanExerciseDto,
  ) {
    await this.assertOwned(userId, planId);

    const exercise = await this.exercisesService.findOne(
      userId,
      dto.exerciseId,
    );

    const saved = await this.dataSource.transaction(
      async (manager) => {
        await this.lockOwnedPlan(manager, userId, planId);

        const repository =
          manager.getRepository(PlanExercise);

        const count = await repository.countBy({
          planId,
        });

        if (count >= 200) {
          throw new BadRequestException('A plan cannot contain more than 200 exercises');
        }

        const last = await repository.findOne({
          where: {
            planId,
          },
          order: {
            position: 'DESC',
          },
        });

        const position = (last?.position ?? 0) + 1;

        const item = repository.create({
          planId,
          ...this.buildExercise(dto, position),
        });

        const result = await repository.save(item);

        await manager.getRepository(Plan).update(
          { id: planId },
          { updatedAt: new Date() },
        );

        return result;
      },
    );

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
    planId: string,
    planExerciseId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.lockOwnedPlan(manager, userId, planId);

      const result = await manager
        .getRepository(PlanExercise)
        .delete({
          id: planExerciseId,
          planId,
        });

      if (!result.affected) {
        throw new NotFoundException(
          'Exercise not found in this plan',
        );
      }

      await manager.getRepository(Plan).update(
        { id: planId },
        { updatedAt: new Date() },
      );
    });
  }

  async delete(userId: string, planId: string): Promise<void> {
    const result = await this.plans.delete({
      id: planId,
      ownerId: userId,
    });

    if (!result.affected) {
      throw new NotFoundException('Plan not found');
    }
  }

  private buildExercise(
    input: PlanExerciseInputDto,
    position: number,
  ) {
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

  private async assertOwned(
    userId: string,
    planId: string,
  ): Promise<void> {
    const exists = await this.plans.existsBy({
      id: planId,
      ownerId: userId,
    });

    if (!exists) {
      throw new NotFoundException('Plan not found');
    }
  }

  private async lockOwnedPlan(
    manager: EntityManager,
    userId: string,
    planId: string,
  ): Promise<Plan> {
    const plan = await manager.getRepository(Plan).findOne({
      where: {
        id: planId,
        ownerId: userId,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  private async toView(userId: string, plan: Plan) {
    const exercises =
      await this.exercisesService.getAvailableByIds(
        userId,
        plan.planExercises.map((item) => item.exerciseId),
      );

    const exerciseById = new Map(
      exercises.map((exercise) => [
        exercise.id,
        exercise,
      ]),
    );

    return {
      id: plan.id,
      ownerId: plan.ownerId,
      title: plan.title,
      description: plan.description,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,

      exercises: plan.planExercises.map((item) => ({
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