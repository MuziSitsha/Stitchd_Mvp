import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Can we lock the guest count by Wednesday?' })
  @IsString()
  @MaxLength(2000)
  message: string;
}
