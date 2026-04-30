import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SendChatMessageDto {
  @ApiProperty({ example: 'I am outside the gate.' })
  @IsString()
  @MaxLength(1000)
  message: string;
}