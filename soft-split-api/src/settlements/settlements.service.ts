import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement } from './entities/settlement.entity';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private settlementsRepo: Repository<Settlement>,
    private usersService: UsersService,
    private activityService: ActivityService,
  ) {}

  async create(payerId: string, dto: CreateSettlementDto): Promise<Settlement> {
    if (dto.payeeId === payerId) {
      throw new BadRequestException('Cannot settle up with yourself');
    }

    const payer = await this.usersService.findOne(payerId);
    if (!payer || !payer.isActive) {
      throw new BadRequestException('Payer is not active');
    }

    const payee = await this.usersService.findOne(dto.payeeId);
    if (!payee) {
      throw new NotFoundException('Payee not found');
    }
    if (!payee.isActive) {
      throw new BadRequestException('Payee is not active');
    }

    const settlement = this.settlementsRepo.create({
      payer,
      payee,
      // amount stored as decimal — string form keeps precision through TypeORM
      amount: dto.amount.toFixed(2),
      note: dto.note,
    });
    const saved = await this.settlementsRepo.save(settlement);

    // Log to the activity feed. Failures here are not fatal to the settlement
    // itself; if logging breaks the user still has their settlement.
    try {
      await this.activityService.log({
        type: 'settlement',
        actor: payer,
        recipient: payee,
        payload: {
          settlementId: saved.id,
          amount: dto.amount,
          note: dto.note ?? null,
        },
      });
    } catch {
      // intentionally swallowed
    }

    return saved;
  }

  async listForUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.settlementsRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.payer', 'payer')
      .leftJoinAndSelect('s.payee', 'payee')
      .where('payer.id = :userId OR payee.id = :userId', { userId })
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  /**
   * Returns every (non-deleted) settlement that involves `userId` — both as
   * payer and as payee. Used by ExpensesService.getBalances to offset
   * expense-derived balances.
   */
  async findInvolvingUser(userId: string): Promise<Settlement[]> {
    return this.settlementsRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.payer', 'payer')
      .leftJoinAndSelect('s.payee', 'payee')
      .where('payer.id = :userId OR payee.id = :userId', { userId })
      .getMany();
  }
}
