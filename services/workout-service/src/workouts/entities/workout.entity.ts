import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity.js';

@Entity({ schema: 'workouts', name: 'workouts' })
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ name: 'workout_date', type: 'date' })
  workoutDate: Date;

  @Column({
    name: 'duration_minutes',
    type: 'smallint',
    nullable: true,
  })
  durationMinutes: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(
    () => WorkoutExercise,
    (workoutExercise) => workoutExercise.workout,
  )
  exercises: Relation<WorkoutExercise[]>;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
