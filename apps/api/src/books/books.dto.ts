import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class ProgressDto {
  @IsInt()
  @Min(1)
  page: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  percent: number;
}
