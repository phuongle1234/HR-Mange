import { IsInt, IsOptional, Min } from 'class-validator';

export class BaseWorkflowActionDto {
  @IsInt()
  @Min(0)
  revision: number;

  @IsOptional()
  comment?: string;
}
