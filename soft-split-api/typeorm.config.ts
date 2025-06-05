import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from './src/users/entities/user.entity';
import { Group } from './src/groups/entities/group.entity';
import { Expense } from './src/expenses/entities/expense.entity';
import { FriendRequest } from './src/users/entities/friend-request.entity';
import { AddSoftDelete1709556234567 } from './src/migrations/1709556234567-AddSoftDelete';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'softsplit',
  password: 'softsplit123',
  database: 'expense_sharing',
  entities: ['src/**/*.entity.{js,ts}'],
  migrations: ['src/migrations/*.{js,ts}'],
  synchronize: false,
  ssl: false,
}); 