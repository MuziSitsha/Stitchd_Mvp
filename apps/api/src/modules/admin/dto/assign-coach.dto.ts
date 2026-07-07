import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignCoachDto {
  @ApiProperty({ description: 'User id of the coach to assign' })
  @IsUUID()
  coachUserId: string;
}
