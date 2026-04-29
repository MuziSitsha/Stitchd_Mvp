import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'kazi-api',
      timestamp: new Date().toISOString(),
    };
  }
}