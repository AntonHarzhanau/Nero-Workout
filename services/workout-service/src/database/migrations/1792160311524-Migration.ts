import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1792160311524 implements MigrationInterface {
    name = 'Migration1792160311524'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "plan_sets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_exercise_id" uuid NOT NULL, "position" smallint NOT NULL, "weight_kg" numeric(6,2) NOT NULL, "reps" smallint NOT NULL, CONSTRAINT "PK_20e3d9e2c1cf4945a5176015927" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f2a9442f59b6c6f3bb08b142cf" ON "plan_sets"  ("plan_exercise_id", "position") `);
        await queryRunner.query(`ALTER TABLE "plan_sets" ADD CONSTRAINT "FK_38ea2caf8a84a3f91fe3ca5c243" FOREIGN KEY ("plan_exercise_id") REFERENCES "plan_exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plan_sets" DROP CONSTRAINT "FK_38ea2caf8a84a3f91fe3ca5c243"`);
        await queryRunner.query(`DROP INDEX "workouts"."IDX_f2a9442f59b6c6f3bb08b142cf"`);
        await queryRunner.query(`DROP TABLE "plan_sets"`);
    }

}
