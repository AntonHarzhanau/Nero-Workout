import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1792123844537 implements MigrationInterface {
    name = 'Migration1792123844537'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "workouts"."exercises_visibility_enum" AS ENUM('public', 'private')`);
        await queryRunner.query(`CREATE TABLE "exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "title" character varying(120) NOT NULL, "description" text, "visibility" "workouts"."exercises_visibility_enum" NOT NULL DEFAULT 'private', "muscle_group" character varying(120) NOT NULL, "equipment" character varying(120), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "plan_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_id" uuid NOT NULL, "exercise_id" uuid NOT NULL, "position" integer NOT NULL, CONSTRAINT "PK_0ae4497bed40fe63525a6e7cfd2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "title" character varying(120) NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "plan_exercises" ADD CONSTRAINT "FK_d83cf804ef11a84e3dd90a21cd9" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "plan_exercises" ADD CONSTRAINT "FK_4237105180ae696de5a6b33ab5e" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plan_exercises" DROP CONSTRAINT "FK_4237105180ae696de5a6b33ab5e"`);
        await queryRunner.query(`ALTER TABLE "plan_exercises" DROP CONSTRAINT "FK_d83cf804ef11a84e3dd90a21cd9"`);
        await queryRunner.query(`DROP TABLE "plans"`);
        await queryRunner.query(`DROP TABLE "plan_exercises"`);
        await queryRunner.query(`DROP TABLE "exercises"`);
        await queryRunner.query(`DROP TYPE "workouts"."exercises_visibility_enum"`);
    }

}
