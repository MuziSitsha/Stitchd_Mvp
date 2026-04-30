import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';

type CreateNotificationInput = {
  userId: string;
  title: string;
  body: string;
  type: string;
  payload?: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
  ) {}

  async listMine(userId: string) {
    const items = await this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return {
      unreadCount: items.filter((item) => !item.isRead).length,
      items,
    };
  }

  async markRead(notificationId: string, userId: string) {
    const notification = await this.notificationsRepository.findOne({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) {
      throw new ForbiddenException('You cannot update another user\'s notification');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return notification;
  }

  async markAllRead(userId: string) {
    const unread = await this.notificationsRepository.find({ where: { userId, isRead: false } });
    if (unread.length === 0) {
      return { updatedCount: 0 };
    }

    const now = new Date();
    unread.forEach((item) => {
      item.isRead = true;
      item.readAt = now;
    });
    await this.notificationsRepository.save(unread);
    return { updatedCount: unread.length };
  }

  async createNotification(input: CreateNotificationInput) {
    const notification = this.notificationsRepository.create({
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      payload: input.payload ?? null,
    });
    return this.notificationsRepository.save(notification);
  }
}