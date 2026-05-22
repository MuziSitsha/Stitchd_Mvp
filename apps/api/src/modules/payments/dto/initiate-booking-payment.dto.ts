import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class InitiateBookingPaymentDto {
  @ApiPropertyOptional({
    example: 'https://stitchd.co.za/payments/result',
    description: 'Optional shopper return URL after PayFast completes the checkout flow.',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'returnUrl must be a valid URL' })
  returnUrl?: string;
}