import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { WorkoutExercise } from './workout-exercise.entity.js';

@Entity({ schema: 'workouts', name: 'workouts' })
@Index(['ownerId', 'workoutDate'])
export class Workout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ name: 'workout_date', type: 'date' })
  workoutDate: string;

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
    { cascade: ['insert', 'update'] },
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
