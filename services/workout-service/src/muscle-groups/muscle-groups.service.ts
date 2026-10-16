import { BadRequestException, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MuscleGroup } from "./entities/muscle-group.entity.js";
import { Repository, In } from "typeorm";
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

    async getByIds(ids: string[]) {
        const uniqueIds = [...new Set(ids)];

        if (uniqueIds.length === 0) {
            return [];
        }

        const groups = await this.muscleGroupRepository.find({
            where: {
                id: In(uniqueIds),
            }
        })

        if (groups.length !== uniqueIds.length) {
            throw new BadRequestException("Some muscle groups not found");
        }

        return groups.map((group) => ({
            id: group.id,
            code: group.code,
            name: group.name,
        }));
    }
}