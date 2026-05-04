import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class DeclineBookingDto {
  @ApiProperty({ example: 'Provider is unavailable for this route right now.' })
  @IsString()
  @MaxLength(300)
  reason: string;
}