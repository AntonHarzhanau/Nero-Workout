import { DataSource } from "typeorm";
import { Plan } from "../plans/entities/plan.entity.js";
import { PlanExercise } from "../plans/entities/plan-exercise.entity.js";
import { Exercise } from "../exercises/entities/exercise.entity.js";
import { fileURLToPath } from "url";

function requiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

export default new DataSource({
    type: "postgres",
    host: requiredEnv("DB_HOST"),
    port: Number(requiredEnv("DB_PORT")),
    username: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    database: requiredEnv("DB_NAME"),
    schema: "workouts",

    entities: [Plan, PlanExercise, Exercise],

    migrations: [
        fileURLToPath(new URL("./migrations/*.{ts, js}", import.meta.url))
    ],
    synchronize: false,
    migrationsRun: false,
    
})