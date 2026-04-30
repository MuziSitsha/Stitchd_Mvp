import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude } from 'class-validator';

export class UpdateBookingLocationDto {
  @ApiProperty({ example: -26.1076 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 28.0567 })
  @IsLongitude()
  longitude: number;
}