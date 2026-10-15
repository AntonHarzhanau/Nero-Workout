import { Module } from "@nestjs/common";
import { Plan } from "./entities/plan.entity.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlansService } from "./plans.service.js";
import { PlansController } from "./plans.controller.js";

@Module({
    imports: [TypeOrmModule.forFeature([Plan])],
    controllers: [PlansController],
    providers: [PlansService],
})

export class PlansModule {}