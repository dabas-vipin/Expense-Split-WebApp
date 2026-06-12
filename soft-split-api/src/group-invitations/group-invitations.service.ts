import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupInvitation } from './entities/group-invitation.entity';
import { GroupsService } from '../groups/groups.service';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class GroupInvitationsService {
  constructor(
    @InjectRepository(GroupInvitation)
    private invitationsRepo: Repository<GroupInvitation>,
    private groupsService: GroupsService,
    private usersService: UsersService,
    private activityService: ActivityService,
  ) {}

  async invite(
    groupId: string,
    inviterId: string,
    inviteeEmail: string,
  ): Promise<GroupInvitation> {
    const group = await this.groupsService.findOne(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (!group.members.some((member) => member.id === inviterId)) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const invitee = await this.usersService.findByEmail(inviteeEmail);
    if (!invitee || !invitee.isActive) {
      throw new NotFoundException(
        'No active Soft Split user with that email — ask them to sign up first',
      );
    }

    if (invitee.id === inviterId) {
      throw new BadRequestException('You are already in this group');
    }
    if (group.members.some((member) => member.id === invitee.id)) {
      throw new BadRequestException(
        'This user is already a member of the group',
      );
    }

    const existingPending = await this.invitationsRepo.findOne({
      where: {
        group: { id: groupId },
        invitee: { id: invitee.id },
        status: 'pending',
      },
    });
    if (existingPending) {
      throw new BadRequestException(
        'A pending invitation already exists for this user',
      );
    }

    const inviter = await this.usersService.findOne(inviterId);
    const invitation = this.invitationsRepo.create({
      group,
      inviter,
      invitee,
      status: 'pending',
    });
    const saved = await this.invitationsRepo.save(invitation);

    try {
      await this.activityService.log({
        type: 'group_invitation_sent',
        actor: inviter,
        recipient: invitee,
        payload: {
          invitationId: saved.id,
          groupId: group.id,
          groupName: group.name,
        },
      });
    } catch {
      // non-fatal
    }

    return saved;
  }

  async listPendingForUser(userId: string): Promise<GroupInvitation[]> {
    return this.invitationsRepo.find({
      where: { invitee: { id: userId }, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  async listForGroup(
    groupId: string,
    callerId: string,
  ): Promise<GroupInvitation[]> {
    const group = await this.groupsService.findOne(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (!group.members.some((member) => member.id === callerId)) {
      throw new ForbiddenException('You are not a member of this group');
    }
    return this.invitationsRepo.find({
      where: { group: { id: groupId } },
      order: { createdAt: 'DESC' },
    });
  }

  async respond(
    invitationId: string,
    callerId: string,
    accept: boolean,
  ): Promise<GroupInvitation> {
    const invitation = await this.invitationsRepo.findOne({
      where: { id: invitationId },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.invitee.id !== callerId) {
      throw new ForbiddenException(
        'Only the invited user can respond to this invitation',
      );
    }
    if (invitation.status !== 'pending') {
      throw new BadRequestException(
        `Invitation is already ${invitation.status}`,
      );
    }

    invitation.status = accept ? 'accepted' : 'rejected';
    invitation.respondedAt = new Date();
    const saved = await this.invitationsRepo.save(invitation);

    if (accept) {
      // Bypass friendship validation: the invitation IS the consent gate.
      await this.groupsService.addMemberFromInvitation(
        invitation.group.id,
        callerId,
      );

      try {
        await this.activityService.log({
          type: 'group_invitation_accepted',
          actor: invitation.invitee,
          recipient: invitation.inviter,
          payload: {
            invitationId: saved.id,
            groupId: invitation.group.id,
            groupName: invitation.group.name,
          },
        });
      } catch {
        // non-fatal
      }
    }

    return saved;
  }

  async cancel(invitationId: string, callerId: string): Promise<void> {
    const invitation = await this.invitationsRepo.findOne({
      where: { id: invitationId },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== 'pending') {
      throw new BadRequestException(
        `Invitation is already ${invitation.status}`,
      );
    }

    // Either the original inviter, or any current member of the group, can
    // cancel a pending invitation. (Re-load the group to honour current
    // membership rather than trusting the stored group.members snapshot.)
    const group = await this.groupsService.findOne(invitation.group.id);
    const isInviter = invitation.inviter.id === callerId;
    const isMember = !!group?.members.some(
      (member) => member.id === callerId,
    );
    if (!isInviter && !isMember) {
      throw new ForbiddenException(
        'Only the inviter or a current group member can cancel this invitation',
      );
    }

    invitation.status = 'cancelled';
    invitation.respondedAt = new Date();
    await this.invitationsRepo.save(invitation);
  }
}
