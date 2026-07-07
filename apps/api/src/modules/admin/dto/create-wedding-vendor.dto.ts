import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { WeddingEventType } from '../../planner/entities/wedding-event.entity';

export class CreateWeddingVendorDto {
  @ApiPropertyOptional({ enum: WeddingEventType, default: WeddingEventType.WEDDING })
  @IsOptional()
  @IsEnum(WeddingEventType)
  eventType?: WeddingEventType;

  @ApiProperty({ example: 'Venue' })
  @IsString()
  slot: string;

  @ApiPropertyOptional({ example: 'Premium Venue' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({ example: 'Luxe Manor' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'R85,000' })
  @IsString()
  priceLabel: string;

  @ApiPropertyOptional({ example: 8500000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional({ example: 4.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 96 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reviewCount?: number;

  @ApiPropertyOptional({ example: 'home-cleaning' })
  @IsOptional()
  @IsString()
  imageKey?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;
}
