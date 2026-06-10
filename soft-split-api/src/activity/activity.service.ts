import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityEvent } from './entities/activity-event.entity';
import { User } from '../users/entities/user.entity';

export interface LogActivityInput {
  type: string;
  actor: User;
  recipient?: User | null;
  payload?: Record<string, any>;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityEvent)
    private eventsRepo: Repository<ActivityEvent>,
  ) {}

  async log(input: LogActivityInput): Promise<ActivityEvent> {
    const event = this.eventsRepo.create({
      type: input.type,
      actor: input.actor,
      recipient: input.recipient ?? null,
      payload: input.payload ?? null,
    });
    return this.eventsRepo.save(event);
  }

  async listForUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.eventsRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.actor', 'actor')
      .leftJoinAndSelect('event.recipient', 'recipient')
      .where('actor.id = :userId OR recipient.id = :userId', { userId })
      .orderBy('event.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }
}
