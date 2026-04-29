import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertProviderProfileDto {
  @ApiPropertyOptional({ example: 'Trusted electrician serving Sandton and Midrand.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'Johannesburg North' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  serviceArea?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsExperience?: number;

  @ApiPropertyOptional({ example: ['cleaning', 'electrical'], type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  serviceCategoryIds?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  documentsSubmitted?: boolean;
}