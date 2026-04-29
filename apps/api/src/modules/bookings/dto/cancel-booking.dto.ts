import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({ example: 'Customer requested a new schedule.' })
  @IsString()
  @MaxLength(300)
  reason: string;
}