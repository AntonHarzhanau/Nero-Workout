import { Controller, Get } from '@nestjs/common';
import { MuscleGroupsService } from './muscle-groups.service.js';

@Controller('muscle-groups')
export class MuscleGroupsController {
    constructor(
        private readonly muscleGroupsService: MuscleGroupsService
    ) {}

    @Get()
    findAll() {
        return this.muscleGroupsService.findAll();
    }
}
