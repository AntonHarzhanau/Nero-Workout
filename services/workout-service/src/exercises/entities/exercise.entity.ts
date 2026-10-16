import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { PlanExercise } from '../../plans/entities/plan-exercise.entity.js';

export enum ExerciseVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity({ schema: 'workouts', name: 'exercises' })
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ExerciseVisibility,
    default: ExerciseVisibility.PRIVATE,
  })
  visibility: ExerciseVisibility;

  @Column({ name: 'muscle_group', type: 'varchar', length: 120 })
  muscleGroup: string;

  @Column({ name: 'equipment', type: 'varchar', length: 120, nullable: true })
  equipment: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => PlanExercise, (planExercise) => planExercise.exercise)
  planExercises: Relation<PlanExercise[]>;
}
