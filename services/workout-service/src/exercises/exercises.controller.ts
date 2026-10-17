import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth-user.js';
import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { FindExerciseDto } from './dto/find-exercise.dto.js';
import { UpdateExerciseDto } from './dto/update-exercise.dto.js';
import { ExercisesService } from './exercises.service.js';

@Controller('exercises')
@UseGuards(AuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  findForUser(@CurrentUser() user: AuthUser, @Query() query: FindExerciseDto) {
    return this.exercisesService.findManyForUser(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.exercisesService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExerciseDto) {
    return this.exercisesService.create(user.id, dto, user.role === 'admin');
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
