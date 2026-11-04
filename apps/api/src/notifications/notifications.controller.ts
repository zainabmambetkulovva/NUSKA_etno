import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard';

import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications() {
    // TODO: Get notifications for authenticated user
    return { message: 'Get notifications - to be implemented' };
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    // TODO: Mark notification as read
    return { message: 'Mark as read - to be implemented' };
  }

  @Delete(':id')
  deleteNotification(@Param('id') id: string) {
    // TODO: Delete notification
    return { message: 'Delete notification - to be implemented' };
  }
}
