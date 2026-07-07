import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MaxLength } from 'class-validator';
import { WeddingVendorStatus } from '../entities/wedding-vendor-selection.entity';

export class CreateVendorSelectionDto {
  @ApiPropertyOptional({ description: 'The real wedding vendor catalog listing this selection was chosen from' })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiProperty({ example: 'Venue' })
  @IsString()
  @MaxLength(80)
  slot: string;

  @ApiPropertyOptional({ example: 'Premium Venue' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subcategory?: string;

  @ApiProperty({ example: 'Luxe Manor' })
  @IsString()
  @MaxLength(120)
  vendorName: string;

  @ApiPropertyOptional({ example: 8500000, description: 'Price in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional({ enum: WeddingVendorStatus, default: WeddingVendorStatus.SHORTLISTED })
  @IsOptional()
  @IsEnum(WeddingVendorStatus)
  status?: WeddingVendorStatus;
}
