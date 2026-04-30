import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserEntity } from '../users/entities/user.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessageEntity } from './entities/chat-message.entity';

@Module({
	imports: [TypeOrmModule.forFeature([ChatMessageEntity, BookingEntity, UserEntity]), NotificationsModule],
	controllers: [ChatController],
	providers: [ChatService],
	exports: [ChatService],
})
export class ChatModule {}