import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsMobilePhone, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCoachProfileDto {
  @ApiProperty({ description: 'SA mobile number for the coach - the account is created (or reused) and approved for coach login', example: '0821234567' })
  @IsString()
  @IsMobilePhone('en-ZA')
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];
}
