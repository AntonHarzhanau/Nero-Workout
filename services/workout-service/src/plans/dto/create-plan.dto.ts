import { Type } from 'class-transformer';

import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PlanSetInputDto {
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

export class PlanExerciseInputDto {
  @IsUUID()
  exerciseId: string;

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PlanSetInputDto)
  sets: PlanSetInputDto[];
}

export class CreatePlanDto {
  @IsString()
  @Matches(/\S/, {
    message: 'Title must not be empty',
  })
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => PlanExerciseInputDto)
  exercises: PlanExerciseInputDto[];
}