import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UserEntity } from '../users/entities/user.entity';
import { ChatMessageEntity, ChatMessageType } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly chatMessagesRepository: Repository<ChatMessageEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getBookingThread(bookingId: string, actorId: string) {
    const { booking, participant } = await this.assertThreadAccess(bookingId, actorId);
    const messages = await this.chatMessagesRepository.find({
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });

    return {
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      participant: {
        id: participant.id,
        displayName: participant.fullName || participant.phone,
        phone: participant.phone,
      },
      messages,
    };
  }

  async sendMessage(bookingId: string, actorId: string, message: string) {
    const { booking, participant } = await this.assertThreadAccess(bookingId, actorId);
    const chatMessage = await this.chatMessagesRepository.save(
      this.chatMessagesRepository.create({
        bookingId,
        senderId: actorId,
        recipientId: participant.id,
        messageType: ChatMessageType.TEXT,
        message,
      }),
    );

    await this.notificationsService.createNotification({
      userId: participant.id,
      title: 'New booking message',
      body: message,
      type: 'chat_message',
      payload: { bookingId: booking.id, bookingRef: booking.bookingRef, chatMessageId: chatMessage.id },
    });

    return chatMessage;
  }

  async startCall(bookingId: string, actorId: string) {
    const { booking, participant } = await this.assertThreadAccess(bookingId, actorId);
    const callLog = await this.chatMessagesRepository.save(
      this.chatMessagesRepository.create({
        bookingId,
        senderId: actorId,
        recipientId: participant.id,
        messageType: ChatMessageType.CALL_LOG,
        message: 'Call initiated from app',
        callStatus: 'initiated',
      }),
    );

    await this.notificationsService.createNotification({
      userId: participant.id,
      title: 'Incoming call attempt',
      body: `A call was started for booking ${booking.bookingRef}.`,
      type: 'call_started',
      payload: { bookingId: booking.id, bookingRef: booking.bookingRef, chatMessageId: callLog.id },
    });

    return {
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      participantName: participant.fullName || participant.phone,
      participantPhone: participant.phone,
      callLogId: callLog.id,
    };
  }

  private async assertThreadAccess(bookingId: string, actorId: string) {
    const booking = await this.bookingsRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const isCustomer = booking.customerId === actorId;
    const isProvider = booking.providerId === actorId;
    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('You do not have access to this booking thread');
    }

    const participantId = isCustomer ? booking.providerId : booking.customerId;
    if (!participantId) {
      throw new ForbiddenException('Chat and call become available after provider assignment');
    }

    const participant = await this.usersRepository.findOne({ where: { id: participantId } });
    if (!participant) {
      throw new NotFoundException('Booking participant not found');
    }

    return { booking, participant };
  }
}