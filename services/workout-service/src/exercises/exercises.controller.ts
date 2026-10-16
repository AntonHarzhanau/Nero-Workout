import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { UpdateExerciseDto } from './dto/update-exercise.dto.js';
import { ExercisesService } from './exercises.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';



@Controller('exercises')
@UseGuards(AuthGuard)
export class ExercisesController {
  constructor(
    private readonly exercisesService: ExercisesService,
  ) {}

  @Get()
  findAvailable(@CurrentUser() user: AuthUser) {
    return this.exercisesService.findAvailable(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.exercisesService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateExerciseDto,
  ) {
    return this.exercisesService.create(
      user.id,
      dto,
      user.role === 'admin',
    );
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.exercisesService.update(
      user.id,
      id,
      dto,
      user.role === 'admin',
    );
  }

  @Delete(':id')
  delete(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.exercisesService.delete(user.id, id);
  }
}