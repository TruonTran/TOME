import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class SessionDto {
  @IsString()
  bookId: string;

  @IsInt()
  @Min(1)
  @Max(4 * 60 * 60)
  seconds: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000)
  pages?: number;

  /** Ngày địa phương của người dùng, dạng YYYY-MM-DD */
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  day: string;
}
