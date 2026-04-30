import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BookingType, PaymentMethod } from '../entities/booking.entity';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  serviceCategoryId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ enum: BookingType, example: BookingType.INSTANT })
  @IsEnum(BookingType)
  type: BookingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: -26.1076 })
  @IsOptional()
  @IsNumber()
  customerLat?: number;

  @ApiPropertyOptional({ example: 28.0567 })
  @IsOptional()
  @IsNumber()
  customerLng?: number;

  @ApiPropertyOptional({ example: 'Sandton, Johannesburg' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  customerAddress?: string;

  @ApiProperty({ example: 45000 })
  @IsInt()
  @Min(0)
  quotedPriceCents: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'Gate code 2048, call on arrival.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNotes?: string;

  @ApiPropertyOptional({ example: 'WELCOME100' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  promoCode?: string;
}