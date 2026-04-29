import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Deep Cleaning' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'Detailed top-to-bottom cleaning package.' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @ApiProperty({ example: 45000 })
  @IsInt()
  @Min(0)
  basePriceCents: number;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsInt()
  @Min(15)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  supportsInstantBooking?: boolean;
}