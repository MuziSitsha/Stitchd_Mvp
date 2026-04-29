import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty({ example: 'Cleaning' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'Home and office cleaning services.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ example: 'sparkles' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconKey?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}