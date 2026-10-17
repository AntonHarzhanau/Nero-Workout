import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Exercise } from '../../exercises/entities/exercise.entity.js';

@Entity({ schema: 'workouts', name: 'muscle_groups' })
export class MuscleGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @ManyToMany(() => Exercise, (exercise) => exercise.muscleGroups)
  exercises: Relation<Exercise[]>;
}
