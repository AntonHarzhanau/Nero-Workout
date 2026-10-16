import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import { CreateExerciseDto } from './dto/create-exercise.dto.js';
import { UpdateExerciseDto } from './dto/update-exercise.dto.js';
import { ExercisesService } from './exercises.service.js';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role: 'standard' | 'admin';
  };
};

@Controller('exercises')
export class ExercisesController {
  constructor(
    private readonly exercisesService: ExercisesService,
  ) {}

  @Get()
  findAvailable(@Req() request: AuthenticatedRequest) {
    const user = this.getUser(request);

    return this.exercisesService.findAvailable(user.id);
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const user = this.getUser(request);

    return this.exercisesService.findOne(user.id, id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateExerciseDto,
  ) {
    const user = this.getUser(request);

    return this.exercisesService.create(
      user.id,
      dto,
      user.role === 'admin',
    );
  }

  @Put(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    const user = this.getUser(request);

    return this.exercisesService.update(
      user.id,
      id,
      dto,
      user.role === 'admin',
    );
  }

  @Delete(':id')
  delete(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const user = this.getUser(request);

    return this.exercisesService.delete(user.id, id);
  }

  private getUser(request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException();
    }

    return request.user;
  }
}