import { Controller } from '@nestjs/common';
import { ExercisesService } from './exercises.service.js';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}
}
