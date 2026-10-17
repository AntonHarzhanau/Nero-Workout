import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';

import { CreatePlanDto } from './dto/create-plan.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { AddPlanExerciseDto } from './dto/add-plan-exercise.dto.js';

import { PlansService } from './plans.service.js';

@Controller('plans')
@UseGuards(AuthGuard)
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
  ) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.plansService.findMine(user.id);
  }

  @Get(':planId')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('planId', new ParseUUIDPipe()) planId: string,
  ) {
    return this.plansService.findOne(user.id, planId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePlanDto,
  ) {
    return this.plansService.create(user.id, dto);
  }

  @Put(':planId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('planId', new ParseUUIDPipe()) planId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(
      user.id,
      planId,
      dto,
    );
  }

  @Post(':planId/exercises')
  addExercise(
    @CurrentUser() user: AuthUser,
    @Param('planId', new ParseUUIDPipe()) planId: string,
    @Body() dto: AddPlanExerciseDto,
  ) {
    return this.plansService.addExercise(
      user.id,
      planId,
      dto,
    );
  }

  @Delete(':planId/exercises/:planExerciseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeExercise(
    @CurrentUser() user: AuthUser,
    @Param('planId', new ParseUUIDPipe()) planId: string,
    @Param('planExerciseId', new ParseUUIDPipe())
    planExerciseId: string,
  ) {
    return this.plansService.removeExercise(
      user.id,
      planId,
      planExerciseId,
    );
  }

  @Delete(':planId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentUser() user: AuthUser,
    @Param('planId', new ParseUUIDPipe()) planId: string,
  ) {
    return this.plansService.delete(user.id, planId);
  }
}