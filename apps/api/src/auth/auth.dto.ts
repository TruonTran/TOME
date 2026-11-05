import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu cần ít nhất 8 ký tự' })
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class UpdateMeDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(600)
  dailyGoalMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}
