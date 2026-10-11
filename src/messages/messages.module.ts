import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { User } from 'src/users/entities/user.entity';
import { MessagesScheduler } from './messages.scheduler';
import { SmsModule } from 'src/sms/sms.module';
import { MessagesGateway } from './messages.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Message, User]), SmsModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesScheduler, MessagesGateway],
})
export class MessagesModule {}
