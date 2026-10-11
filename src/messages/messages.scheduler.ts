import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MessagesService } from './messages.service';
import { SmsService } from '../sms/sms.service';
import { MessagesGateway } from './messages.gateway';
import { MessageStatus } from './entities/message.entity';

@Injectable()
export class MessagesScheduler {
  private readonly logger = new Logger(MessagesScheduler.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly smsService: SmsService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Cron('*/10 * * * * *')
  async handleScheduledMessages() {
    const messages = await this.messagesService.findPendingMessagesToSend();

    for (const message of messages) {
      // رزرو اتمیک پیام؛ فقط یک اجرا باید موفق شود.
      const claimed = await this.messagesService.claimMessage(message.id);

      if (!claimed) continue;

      try {
        await this.smsService.sendOtp(message.user.phone, message.message);

        await this.messagesService.markAsSent(message.id);

        this.messagesGateway.emitMessageStatusUpdated(
          message.id,
          MessageStatus.SENT,
        );

        this.logger.log(`Message ${message.id} sent successfully.`);
      } catch (error) {
        await this.messagesService.markAsFailed(message.id, 'SMS_SEND_FAILED');

        this.logger.error(`Failed to send message ${message.id}.`);
      }
    }
  }
}
