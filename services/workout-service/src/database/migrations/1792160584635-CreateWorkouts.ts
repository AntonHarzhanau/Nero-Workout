import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkouts1792160584635 implements MigrationInterface {
  name = 'CreateWorkouts1792160584635';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "workout_sets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workout_exercise_id" uuid NOT NULL, "position" smallint NOT NULL, "weight_kg" numeric(6,2) NOT NULL, "reps" smallint NOT NULL, CONSTRAINT "PK_5ad75c97e58e8c660a48926d438" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_df65e94376af201d510fc57fdc" ON "workout_sets"  ("workout_exercise_id", "position") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workout_id" uuid NOT NULL, "exercise_id" uuid NOT NULL, "position" integer NOT NULL, CONSTRAINT "PK_377f9ead6fd69b29f0d0feb1028" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a0656f321d9a96de2eb685e85" ON "workout_exercises"  ("exercise_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bdb37d0c9ccf126663927e12ca" ON "workout_exercises"  ("workout_id", "position") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "title" character varying(120) NOT NULL, "workout_date" date NOT NULL, "duration_minutes" smallint, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5b2319bf64a674d40237dbb1697" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2cfd9907d2591aebd03e4e609" ON "workouts"  ("owner_id", "workout_date") `,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sets" ADD CONSTRAINT "FK_1f6afffea13fac2595347de1dd1" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercises" ADD CONSTRAINT "FK_7e6040e931b008308aaddbb7d32" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercises" ADD CONSTRAINT "FK_9a0656f321d9a96de2eb685e85a" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workout_exercises" DROP CONSTRAINT "FK_9a0656f321d9a96de2eb685e85a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercises" DROP CONSTRAINT "FK_7e6040e931b008308aaddbb7d32"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sets" DROP CONSTRAINT "FK_1f6afffea13fac2595347de1dd1"`,
    );
    await queryRunner.query(
      `DROP INDEX "workouts"."IDX_c2cfd9907d2591aebd03e4e609"`,
    );
    await queryRunner.query(`DROP TABLE "workouts"`);
    await queryRunner.query(
      `DROP INDEX "workouts"."IDX_bdb37d0c9ccf126663927e12ca"`,
    );
    await queryRunner.query(
      `DROP INDEX "workouts"."IDX_9a0656f321d9a96de2eb685e85"`,
    );
    await queryRunner.query(`DROP TABLE "workout_exercises"`);
    await queryRunner.query(
      `DROP INDEX "workouts"."IDX_df65e94376af201d510fc57fdc"`,
    );
    await queryRunner.query(`DROP TABLE "workout_sets"`);
  }
}
