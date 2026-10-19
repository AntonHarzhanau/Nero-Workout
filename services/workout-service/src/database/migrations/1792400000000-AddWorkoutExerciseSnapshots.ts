import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkoutExerciseSnapshots1792400000000 implements MigrationInterface {
  name = 'AddWorkoutExerciseSnapshots1792400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE workouts.workout_exercises
        ADD COLUMN exercise_name_snapshot varchar(120),
        ADD COLUMN muscle_groups_snapshot text[]
    `);
    // Historical catalog values were not stored; backfill from the current catalog.
    await queryRunner.query(`
      UPDATE workouts.workout_exercises we
      SET exercise_name_snapshot = e.title,
          muscle_groups_snapshot = ARRAY(
            SELECT mg.code::text
            FROM workouts.exercise_muscle_groups emg
            JOIN workouts.muscle_groups mg ON mg.id = emg.muscle_group_id
            WHERE emg.exercise_id = e.id
            ORDER BY mg.code
          )
      FROM workouts.exercises e
      WHERE e.id = we.exercise_id
    `);
    await queryRunner.query(`
      ALTER TABLE workouts.workout_exercises
        ALTER COLUMN exercise_name_snapshot SET NOT NULL,
        ALTER COLUMN muscle_groups_snapshot SET NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE workouts.workout_exercises
        DROP COLUMN muscle_groups_snapshot,
        DROP COLUMN exercise_name_snapshot
    `);
  }
}
