import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';

import { PlanExercise } from './entities/plan-exercise.entity.js';
import { Plan } from './entities/plan.entity.js';
import { assertCanAddPlanExercise } from './plan.policy.js';
import type {
  PlanExerciseValues,
  PlanSummary,
  PlanValues,
} from './plan.types.js';

@Injectable()
export class PlansRepository {
  constructor(
    @InjectRepository(Plan)
    private readonly repository: Repository<Plan>,
    private readonly dataSource: DataSource,
  ) {}

  findMine(userId: string): Promise<PlanSummary[]> {
    return this.repository.find({
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { ownerId: userId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  findOwnedById(userId: string, planId: string): Promise<Plan | null> {
    return this.repository.findOne({
      where: { id: planId, ownerId: userId },
      relations: { planExercises: { sets: true } },
      order: {
        planExercises: {
          position: 'ASC',
          sets: { position: 'ASC' },
        },
      },
    });
  }

  existsOwned(userId: string, planId: string): Promise<boolean> {
    return this.repository.existsBy({ id: planId, ownerId: userId });
  }

  create(userId: string, values: PlanValues): Promise<Plan> {
    const plan = this.repository.create({
      ownerId: userId,
      title: values.title,
      description: values.description,
      planExercises: values.exercises,
    });

    return this.repository.save(plan);
  }

  async replaceOwned(
    userId: string,
    planId: string,
    values: PlanValues,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const plan = await this.lockOwnedPlan(manager, userId, planId);

      await manager.getRepository(PlanExercise).delete({ planId });

      const repository = manager.getRepository(Plan);
      const updated = repository.create({
        id: plan.id,
        ownerId: plan.ownerId,
        title: values.title,
        description: values.description,
        updatedAt: new Date(),
        planExercises: values.exercises,
      });

      await repository.save(updated);
    });
  }

  appendExercise(
    userId: string,
    planId: string,
    values: PlanExerciseValues,
  ): Promise<PlanExercise> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockOwnedPlan(manager, userId, planId);

      const repository = manager.getRepository(PlanExercise);
      const count = await repository.countBy({ planId });

      assertCanAddPlanExercise(count);

      const last = await repository.findOne({
        where: { planId },
        order: { position: 'DESC' },
      });

      const item = repository.create({
        planId,
        ...values,
        position: (last?.position ?? 0) + 1,
      });

      const saved = await repository.save(item);

      await this.touchPlan(manager, planId);

      return saved;
    });
  }

  async removeExercise(
    userId: string,
    planId: string,
    planExerciseId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.lockOwnedPlan(manager, userId, planId);

      const result = await manager.getRepository(PlanExercise).delete({
        id: planExerciseId,
        planId,
      });

      if (!result.affected) {
        throw new NotFoundException('Exercise not found in this plan');
      }

      await this.touchPlan(manager, planId);
    });
  }

  async deleteOwned(userId: string, planId: string): Promise<boolean> {
    const result = await this.repository.delete({
      id: planId,
      ownerId: userId,
    });

    return Boolean(result.affected);
  }

  async deleteAllForUser(
    userId: string,
    manager: EntityManager,
  ): Promise<void> {
    await manager.delete(Plan, { ownerId: userId });
  }

  private async lockOwnedPlan(
    manager: EntityManager,
    userId: string,
    planId: string,
  ): Promise<Plan> {
    const plan = await manager.getRepository(Plan).findOne({
      where: { id: planId, ownerId: userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  private async touchPlan(
    manager: EntityManager,
    planId: string,
  ): Promise<void> {
    await manager
      .getRepository(Plan)
      .update({ id: planId }, { updatedAt: new Date() });
  }
}
