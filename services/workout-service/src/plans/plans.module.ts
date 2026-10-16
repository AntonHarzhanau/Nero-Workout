import { Module } from "@nestjs/common";
import { Plan } from "./entities/plan.entity.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlansService } from "./plans.service.js";
import { PlansController } from "./plans.controller.js";
import { PlanExercise } from "./entities/plan-exercise.entity.js";
import { ExercisesModule } from "../exercises/exercises.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PlanSet } from "./entities/plan-set.entity.js";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Plan,
            PlanExercise,
            PlanSet,
        ]),
        ExercisesModule,
        AuthModule,
    ],
    controllers: [PlansController],
    providers: [PlansService],
})

export class PlansModule {}