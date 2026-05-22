import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RedeemReferralDto {
  @ApiProperty({ example: 'STITCHDXY12AB' })
  @IsString()
  @MaxLength(20)
  referralCode: string;
}