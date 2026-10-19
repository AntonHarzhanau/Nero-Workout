import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InternalTokenGuard } from '../internal-auth/internal-token.guard.js';
import { FindWorkoutStatisticsDto } from './dto/find-workout-statistics.dto.js';
import { WorkoutStatisticsService } from './workout-statistics.service.js';

@Controller('internal/users/:userId/workouts')
@UseGuards(InternalTokenGuard)
export class WorkoutStatisticsController {
  constructor(private readonly statisticsService: WorkoutStatisticsService) {}

  @Get()
  findForUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Query() query: FindWorkoutStatisticsDto,
  ) {
    return this.statisticsService.findForUser(userId, query);
  }
}
