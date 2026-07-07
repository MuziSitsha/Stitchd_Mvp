import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { WeddingVendorStatus } from '../entities/wedding-vendor-selection.entity';

export class UpdateVendorSelectionDto {
  @ApiPropertyOptional({ enum: WeddingVendorStatus })
  @IsOptional()
  @IsEnum(WeddingVendorStatus)
  status?: WeddingVendorStatus;

  @ApiPropertyOptional({ example: 8500000, description: 'Amount paid so far, in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaidCents?: number;
}
