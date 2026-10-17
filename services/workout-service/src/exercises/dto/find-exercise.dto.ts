import { Type } from 'class-transformer';

import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum ExerciseScope {
  ALL = 'all',
  MINE = 'mine',
  PUBLIC = 'public',
}

export class FindExerciseDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsEnum(ExerciseScope)
  scope: ExerciseScope = ExerciseScope.ALL;

  @IsOptional()
  @IsUUID('all')
  muscleGroupId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
