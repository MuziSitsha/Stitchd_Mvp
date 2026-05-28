import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

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

  @Get('surface')
  @ApiOperation({ summary: 'Get the richer planner client surface for an event type' })
  @ApiQuery({ name: 'eventType', required: false, enum: ['wedding', 'lobola', 'funeral', 'corporate', 'birthday'] })
  getPlannerSurface(@Query('eventType') eventType?: PlannerEventType) {
    return this.plannerService.getSurfaceExperience(eventType);
  }

  @Post('auto-pick')
  @ApiOperation({ summary: 'Get AI auto-pick planner squad suggestions' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        eventType: { type: 'string', enum: ['wedding', 'lobola', 'funeral', 'corporate', 'birthday'] },
      },
    },
  })
  autoPick(@Body() body: { eventType?: PlannerEventType }) {
    return this.plannerService.getAutoPickExperience(body.eventType);
  }
}