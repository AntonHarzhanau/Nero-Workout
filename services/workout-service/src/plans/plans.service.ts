import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Plan } from "./entities/plan.entity.js";
import { Repository } from "typeorm";

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private readonly plans: Repository<Plan>
    ) {}

    findMine(userId: string) {
        return this.plans.find({
            where: { ownerId: userId},
            order: { createdAt: 'DESC' }
        });
    }

    create(userId: string, title: string) {
        const plan = this.plans.create({
            ownerId: userId,
            title,
        });
        
        return this.plans.save(plan);
    }
}