import { Controller, Get, ParseUUIDPipe, Post, Query, Body } from "@nestjs/common";
import { PlansService } from "./plans.service.js";

@Controller('plans')
export class PlansController {
    constructor(
        private readonly plansService: PlansService 
    ) {}

    @Get()
    findMine(
        @Query('owner_id', new ParseUUIDPipe()) ownerId: string
    ) {
        return this.plansService.findMine(ownerId);
    }

    @Post()
    create(
        @Query('owner_id', new ParseUUIDPipe()) ownerId: string,
        @Body('title') title: string,
    ) {
        return this.plansService.create(ownerId, title);
    }
}