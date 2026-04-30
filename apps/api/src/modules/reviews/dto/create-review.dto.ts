import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'd5d7be22-3f53-4a1f-9a8c-7c36bc6d9b95' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Arrived on time and handled the job professionally.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}