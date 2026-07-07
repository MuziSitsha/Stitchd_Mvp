import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMobilePhone, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateVendorProfileDto {
  @ApiProperty({ description: 'SA mobile number for the vendor - the account is created (or reused) and approved for vendor login', example: '0821234567' })
  @IsString()
  @IsMobilePhone('en-ZA')
  phone: string;

  @ApiProperty({ description: 'The wedding vendor catalog listing this login represents' })
  @IsUUID()
  vendorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;
}
