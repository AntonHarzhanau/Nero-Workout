import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Plan } from './plan.entity.js';
import type { Relation } from 'typeorm';
import { Exercise } from '../../exercises/entities/exercise.entity.js';

@Entity({ schema: 'workouts', name: 'plan_exercises' })
export class PlanExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @Column({ name: 'exercise_id', type: 'uuid' })
  exerciseId: string;

  @Column({ type: 'int' })
  position: number;

  @ManyToOne(() => Plan, (plan) => plan.planExercises, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<Plan>;

  @ManyToOne(() => Exercise, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Relation<Exercise>;

}
