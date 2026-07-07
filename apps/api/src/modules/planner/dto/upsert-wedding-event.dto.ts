import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { WeddingEventType } from '../entities/wedding-event.entity';

export class UpsertWeddingEventDto {
  @ApiPropertyOptional({ enum: WeddingEventType, default: WeddingEventType.WEDDING })
  @IsOptional()
  @IsEnum(WeddingEventType)
  eventType?: WeddingEventType;

  @ApiPropertyOptional({ example: 'Thabo and Lelo Wedding Weekend' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional({ example: '2026-09-26' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ example: 40000000, description: 'Total budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetTotalCents?: number;

  @ApiPropertyOptional({ example: 'Lanseria, Gauteng' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  locationLabel?: string;

  @ApiPropertyOptional({ example: -25.9346 })
  @IsOptional()
  @IsLatitude()
  venueLat?: number;

  @ApiPropertyOptional({ example: 27.9268 })
  @IsOptional()
  @IsLongitude()
  venueLng?: number;
}
