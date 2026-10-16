import { Module } from "@nestjs/common";
import { Plan } from "./entities/plan.entity.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlansService } from "./plans.service.js";
import { PlansController } from "./plans.controller.js";
import { PlanExercise } from "./entities/plan-exercise.entity.js";

@Module({
    imports: [TypeOrmModule.forFeature([Plan, PlanExercise])],
    controllers: [PlansController],
    providers: [PlansService],
})

export class PlansModule {}