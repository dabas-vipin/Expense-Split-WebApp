import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupInvitation } from './entities/group-invitation.entity';
import { GroupInvitationsService } from './group-invitations.service';
import { GroupInvitationsController } from './group-invitations.controller';
import { GroupsModule } from '../groups/groups.module';
import { UsersModule } from '../users/users.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupInvitation]),
    GroupsModule,
    UsersModule,
    ActivityModule,
  ],
  providers: [GroupInvitationsService],
  controllers: [GroupInvitationsController],
  exports: [GroupInvitationsService],
})
export class GroupInvitationsModule {}
