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

import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { UpdateWorkoutDto } from './dto/update-workout.dto.js';
import { AddWorkoutExerciseDto } from './dto/add-workout-exercise.dto.js';

import { WorkoutsService } from './workouts.service.js';

@Controller('workouts')
@UseGuards(AuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.workoutsService.findMine(user.id);
  }

  @Get(':workoutId')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('workoutId', new ParseUUIDPipe()) workoutId: string,
  ) {
    return this.workoutsService.findOne(user.id, workoutId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkoutDto) {
    return this.workoutsService.create(user.id, dto);
  }

  @Put(':workoutId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('workoutId', new ParseUUIDPipe()) workoutId: string,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workoutsService.update(user.id, workoutId, dto);
  }

  @Post(':workoutId/exercises')
  addExercise(
    @CurrentUser() user: AuthUser,
    @Param('workoutId', new ParseUUIDPipe()) workoutId: string,
    @Body() dto: AddWorkoutExerciseDto,
  ) {
    return this.workoutsService.addExercise(user.id, workoutId, dto);
  }

  @Delete(':workoutId/exercises/:workoutExerciseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeExercise(
    @CurrentUser() user: AuthUser,
    @Param('workoutId', new ParseUUIDPipe()) workoutId: string,
    @Param('workoutExerciseId', new ParseUUIDPipe())
    workoutExerciseId: string,
  ) {
    return this.workoutsService.removeExercise(
      user.id,
      workoutId,
      workoutExerciseId,
    );
  }

  @Delete(':workoutId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentUser() user: AuthUser,
    @Param('workoutId', new ParseUUIDPipe()) workoutId: string,
  ) {
    return this.workoutsService.delete(user.id, workoutId);
  }
}
