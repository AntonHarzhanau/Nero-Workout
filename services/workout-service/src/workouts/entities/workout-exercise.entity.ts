import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { Exercise } from '../../exercises/entities/exercise.entity.js';
import { Workout } from './workout.entity.js';
import { WorkoutSet } from './workout-set.entity.js';

@Entity({ schema: 'workouts', name: 'workout_exercises' })
@Index(['workoutId', 'position'], { unique: true })
@Index(['exerciseId'])
export class WorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workout_id', type: 'uuid' })
  workoutId: string;

  @Column({ name: 'exercise_id', type: 'uuid' })
  exerciseId: string;

  @Column({ type: 'smallint' })
  position: number;

  @ManyToOne(() => Workout, (workout) => workout.exercises, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workout_id' })
  workout: Relation<Workout>;

  @ManyToOne(() => Exercise, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Relation<Exercise>;

  @OneToMany(() => WorkoutSet, (set) => set.workoutExercise)
  sets: Relation<WorkoutSet[]>;
}
