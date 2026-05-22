import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { PlannerService, PlannerEventType, PlannerPersona } from './planner.service';

@ApiTags('planner')
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Get('mvp')
  @ApiOperation({ summary: 'Get the STITCHD MVP planner data for an event type and persona' })
  @ApiQuery({ name: 'eventType', required: false, enum: ['wedding', 'lobola', 'funeral', 'corporate', 'birthday'] })
  @ApiQuery({ name: 'persona', required: false, enum: ['client', 'supplier', 'coach', 'admin'] })
  getPlannerMvp(
    @Query('eventType') eventType?: PlannerEventType,
    @Query('persona') persona?: PlannerPersona,
  ) {
    return this.plannerService.getMvpExperience(eventType, persona);
  }
}