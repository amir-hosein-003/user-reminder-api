import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Message, MessageStatus } from './entities/message.entity';
import { LessThanOrEqual, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createMessageDto: CreateMessageDto) {
    const existingUser = await this.userRepository.findOne({
      where: { id: createMessageDto.userId },
    });

    if (!existingUser) throw new NotFoundException({ code: 'USER_NOT_FOUND' });

    const scheduledAt = new Date(createMessageDto.scheduledAt);

    if (
      Number.isNaN(scheduledAt.getTime()) ||
      scheduledAt.getTime() <= Date.now()
    )
      throw new BadRequestException({ code: 'INVALIDE_DATE' });

    const message = this.messageRepository.create({
      user: existingUser,
      message: createMessageDto.message.trim(),
      scheduledAt,
      status: MessageStatus.PENDING,
      sentAt: null,
      failureReason: null,
    });

    const savedMessage = await this.messageRepository.save(message);

    // existingUser.messages?.push((savedMessage.id));

    return savedMessage;
  }

  async findAll() {
    return this.messageRepository.find({
      relations: { user: true },
      order: { scheduledAt: 'ASC' },
    });
  }

  async findByUserId(userId: string) {
    const existingMessage = this.messageRepository.find({
      where: { user: { id: userId } },
      order: { scheduledAt: 'ASC' },
    });

    if (!existingMessage)
      throw new NotFoundException({ code: 'NOT_FOUND_USER_MESSAGES' });

    return existingMessage;
  }

  async cancelMessage(id: string) {
    const existingMessage = await this.messageRepository.findOne({
      where: { id },
    });

    if (!existingMessage)
      throw new NotFoundException({ code: 'MESSAGE_NOT_FOUND' });

    if (existingMessage.status !== MessageStatus.PENDING) {
      throw new BadRequestException({
        code: 'MESSAGE_CANNOT_BE_CANCELLED',
      });
    }

    existingMessage.status = MessageStatus.CANCELLED;

    return this.messageRepository.save(existingMessage);
  }

  async findPendingMessagesToSend(): Promise<Message[]> {
    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user')
      .where('message.status = :status', {
        status: MessageStatus.PENDING,
      })
      .andWhere('message.scheduledAt <= :now', {
        now: new Date(),
      })
      .orderBy('message.scheduledAt', 'ASC')
      .getMany();
  }

  async claimMessage(id: string): Promise<boolean> {
    const result = await this.messageRepository.update(
      {
        id,
        status: MessageStatus.PENDING,
        scheduledAt: LessThanOrEqual(new Date()),
      },
      {
        status: MessageStatus.PROCESSING,
      },
    );

    return result.affected === 1;
  }

  async markAsSent(id: string): Promise<void> {
    await this.messageRepository.update(
      {
        id,
        status: MessageStatus.PROCESSING,
      },
      {
        status: MessageStatus.SENT,
        sentAt: new Date(),
        failureReason: null,
      },
    );
  }

  async markAsFailed(id: string, reason: string): Promise<void> {
    await this.messageRepository.update(
      {
        id,
        status: MessageStatus.PROCESSING,
      },
      {
        status: MessageStatus.FAILED,
        failureReason: reason,
      },
    );
  }
}
