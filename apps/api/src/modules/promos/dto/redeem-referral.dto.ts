import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RedeemReferralDto {
  @ApiProperty({ example: 'KAZIXY12AB' })
  @IsString()
  @MaxLength(20)
  referralCode: string;
}