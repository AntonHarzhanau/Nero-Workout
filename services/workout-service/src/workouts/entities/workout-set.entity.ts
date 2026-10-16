import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { WorkoutExercise } from './workout-exercise.entity.js';

@Entity({ schema: 'workouts', name: 'workout_sets' })
@Index(['workoutExerciseId', 'position'], { unique: true })
export class WorkoutSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workout_exercise_id', type: 'uuid' })
  workoutExerciseId: string;

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

  @ManyToOne(() => WorkoutExercise, (workoutExercise) => workoutExercise.sets, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workout_exercise_id' })
  workoutExercise: Relation<WorkoutExercise>;
}
