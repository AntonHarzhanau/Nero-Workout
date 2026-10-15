import { IsString, Length } from "class-validator";

export class CreatePlanDto {
    @IsString()
    @Length(1, 120)
    title!: string;
}