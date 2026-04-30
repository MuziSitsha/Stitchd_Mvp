import { Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('mine')
  @ApiOperation({ summary: 'List notifications for the current user' })
  listMine(@Request() req) {
    return this.notificationsService.listMine(req.user.id);
  }

  @Patch('mine/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for the current user' })
  markAllRead(@Request() req) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markRead(id, req.user.id);
  }
}