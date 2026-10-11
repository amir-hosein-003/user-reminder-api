import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { phone: createUserDto.phone },
    });

    if (existingUser)
      throw new BadRequestException({ code: 'USER_ALREADY_EXIST' });

    const newUser = this.userRepository.create(createUserDto);

    return this.userRepository.save(newUser);
  }

  async findAll() {
    return await this.userRepository.find({
      relations: { messages: true },
    });
  }

  async findOne(userId: string) {
    const existingUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: { messages: true },
    });

    if (!existingUser) throw new NotFoundException({ code: 'USER_NOT_FOUND' });

    return existingUser;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
