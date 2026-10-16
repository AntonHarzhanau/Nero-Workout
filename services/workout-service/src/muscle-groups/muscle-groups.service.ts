import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MuscleGroup } from "./entities/muscle-group.entity.js";
import { Repository } from "typeorm/browser/repository/Repository.js";
import { DEFAULT_MUSCLE_GROUPS } from "./muscle-groups.data.js";

@Injectable()
export class MuscleGroupsService implements OnApplicationBootstrap {
    constructor(
        @InjectRepository(MuscleGroup)
        private readonly muscleGroupRepository: Repository<MuscleGroup>
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        await this.muscleGroupRepository
            .createQueryBuilder()
            .insert()
            .into(MuscleGroup)
            .values(DEFAULT_MUSCLE_GROUPS)
            .orIgnore()
            .execute();
    }

    findAll(): Promise<MuscleGroup[]> {
        return this.muscleGroupRepository.find({
            order: {
                name: "ASC",
            },
        });
    }
}