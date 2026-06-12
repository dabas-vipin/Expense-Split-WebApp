// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { ExpensesModule } from './expenses/expenses.module';
import { GroupsModule } from './groups/groups.module';
import { AuthModule } from './auth/auth.module';
import { FiltersModule } from './filters/filters.module';
import { SettlementsModule } from './settlements/settlements.module';
import { ActivityModule } from './activity/activity.module';
import { GroupInvitationsModule } from './group-invitations/group-invitations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => databaseConfig(configService),
    }),
    // Serve user-uploaded files (avatars, ...) under /uploads. Path mirrors
    // what UsersService writes to.
    ServeStaticModule.forRoot({
      rootPath: process.env.UPLOADS_DIR
        ? join(process.env.UPLOADS_DIR)
        : join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { fallthrough: true },
    }),
    UsersModule,
    ExpensesModule,
    GroupsModule,
    AuthModule,
    FiltersModule,
    SettlementsModule,
    ActivityModule,
    GroupInvitationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
