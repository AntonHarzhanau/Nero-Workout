import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { PlanExercise } from './plan-exercise.entity.js';

@Entity({ schema: 'workouts', name: 'plan_sets' })
@Index(['planExerciseId', 'position'], { unique: true })
export class PlanSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_exercise_id', type: 'uuid' })
  planExerciseId: string;

  @Column({ type: 'smallint' })
  position: number;

  @Column({
    name: 'weight_kg',
    type: 'decimal',
    precision: 6,
    scale: 2,
  })
  weightKg: string;

  @Column({ type: 'smallint' })
  reps: number;

  @ManyToOne(
    () => PlanExercise,
    (planExercise) => planExercise.sets,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'plan_exercise_id' })
  planExercise: Relation<PlanExercise>;
}