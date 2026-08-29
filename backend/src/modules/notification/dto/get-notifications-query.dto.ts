import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetNotificationsQueryDto {
  @Transform(({ value }) => Number(value ?? 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRead?: boolean;
}
