import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { WorkoutsService } from "../workouts/workouts.service.js";
import { PlansService } from "../plans/plans.service.js";
import { ExercisesService } from "../exercises/exercises.service.js";

@Injectable()
export class UserCleanupService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly workouts: WorkoutsService,
        private readonly plans: PlansService,
        private readonly exercices: ExercisesService
    ) {}

    async deleteUserData(userId: string): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            await this.workouts.deleteAllForUser(userId, manager);
            await this.plans.deleteAllForUser(userId, manager);
            await this.exercices.deletePrivateForUser(userId, manager);
        })
    }
}