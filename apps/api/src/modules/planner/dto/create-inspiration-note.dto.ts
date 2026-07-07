import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateInspirationNoteDto {
  @ApiProperty({ example: 'Soft gold ceremony' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'Focus on candlelight, low florals, and creamy textures.' })
  @IsString()
  @MaxLength(2000)
  note: string;
}
