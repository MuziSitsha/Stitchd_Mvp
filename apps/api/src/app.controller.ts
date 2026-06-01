import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getIndex() {
    return {
      status: 'ok',
      service: 'stitchd-api',
      mode: (process.env.PLANNER_ONLY_MODE || 'false').toLowerCase() === 'true' ? 'planner-only' : 'full',
      routes: {
        health: '/api/v1/health',
        plannerMvp: '/api/v1/planner/mvp',
        plannerSurface: '/api/v1/planner/surface',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'stitchd-api',
      timestamp: new Date().toISOString(),
    };
  }
}