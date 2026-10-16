import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, ValidateIf } from "class-validator";
import { ExerciseVisibility } from "../entities/exercise.entity.js";

export class CreateExerciseDto {
    @IsString()
    @Matches(/\S/, { message: 'Title must not be empty' })
    @MaxLength(120)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string | null;

    @ValidateIf((_, value) => value !== undefined)
    @IsEnum(ExerciseVisibility)
    visibility?: ExerciseVisibility;
    
    @IsArray()
    @ArrayUnique()
    @ArrayMaxSize(10)
    @IsUUID('all', { each: true })
    muscleGroups: string[];

    @IsOptional()
    @IsString()
    @MaxLength(120)
    equipment?: string | null;
}