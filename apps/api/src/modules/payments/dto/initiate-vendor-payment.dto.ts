import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class InitiateVendorPaymentDto {
  @ApiPropertyOptional({
    description: 'Amount to pay toward this vendor selection, in cents. Defaults to the full remaining balance and is clamped to it.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @ApiPropertyOptional({
    example: 'https://stitchd.co.za/planner',
    description: 'Optional shopper return URL after PayFast completes the checkout flow.',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'returnUrl must be a valid URL' })
  returnUrl?: string;
}
