import { Type } from 'class-transformer';

import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class WorkoutSetInputDto {
  @IsNumber({
    maxDecimalPlaces: 2,
    allowNaN: false,
    allowInfinity: false,
  })
  @Min(0)
  @Max(9999.99)
  weightKg: number;

  @IsInt()
  @Min(1)
  @Max(32767)
  reps: number;
}

export class WorkoutExerciseInputDto {
  @IsUUID()
  exerciseId: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => WorkoutSetInputDto)
  sets: WorkoutSetInputDto[];
}

export class CreateWorkoutDto {
  @IsString()
  @Matches(/\S/, { message: 'Title must not be empty' })
  @MaxLength(120)
  title: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  workoutDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  durationMinutes?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseInputDto)
  exercises: WorkoutExerciseInputDto[];
}