import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1792126492933 implements MigrationInterface {
    name = 'Migration1792126492933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "muscle_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "name" character varying(120) NOT NULL, CONSTRAINT "UQ_a3be686e0bf1396ebb968057d44" UNIQUE ("code"), CONSTRAINT "PK_87e03ee9f78be5d7a7d0e08897e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exercise_muscle_groups" ("exercise_id" uuid NOT NULL, "muscle_group_id" uuid NOT NULL, CONSTRAINT "PK_a65ecbf38ebd9c20caba547361e" PRIMARY KEY ("exercise_id", "muscle_group_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e1fbbde9b8e6e92a71d06f812b" ON "exercise_muscle_groups"  ("exercise_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b53a25187c505e5df8e0116607" ON "exercise_muscle_groups"  ("muscle_group_id") `);
        await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN "muscle_group"`);
        await queryRunner.query(`ALTER TABLE "exercise_muscle_groups" ADD CONSTRAINT "FK_e1fbbde9b8e6e92a71d06f812b5" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "exercise_muscle_groups" ADD CONSTRAINT "FK_b53a25187c505e5df8e01166070" FOREIGN KEY ("muscle_group_id") REFERENCES "muscle_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exercise_muscle_groups" DROP CONSTRAINT "FK_b53a25187c505e5df8e01166070"`);
        await queryRunner.query(`ALTER TABLE "exercise_muscle_groups" DROP CONSTRAINT "FK_e1fbbde9b8e6e92a71d06f812b5"`);
        await queryRunner.query(`ALTER TABLE "exercises" ADD "muscle_group" character varying(120) NOT NULL`);
        await queryRunner.query(`DROP INDEX "workouts"."IDX_b53a25187c505e5df8e0116607"`);
        await queryRunner.query(`DROP INDEX "workouts"."IDX_e1fbbde9b8e6e92a71d06f812b"`);
        await queryRunner.query(`DROP TABLE "exercise_muscle_groups"`);
        await queryRunner.query(`DROP TABLE "muscle_groups"`);
    }

}
