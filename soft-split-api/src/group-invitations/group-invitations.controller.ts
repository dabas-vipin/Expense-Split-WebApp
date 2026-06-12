import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupInvitationsService } from './group-invitations.service';
import { CreateGroupInvitationDto } from './dto/create-group-invitation.dto';
import { RespondGroupInvitationDto } from './dto/respond-group-invitation.dto';

@Controller()
export class GroupInvitationsController {
  constructor(
    private readonly invitationsService: GroupInvitationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('groups/:id/invitations')
  async invite(
    @Param('id') groupId: string,
    @Request() req,
    @Body() dto: CreateGroupInvitationDto,
  ) {
    return this.invitationsService.invite(groupId, req.user.id, dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups/:id/invitations')
  async listForGroup(@Param('id') groupId: string, @Request() req) {
    return this.invitationsService.listForGroup(groupId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('group-invitations/pending')
  async listPendingForMe(@Request() req) {
    return this.invitationsService.listPendingForUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('group-invitations/:id/respond')
  async respond(
    @Param('id') invitationId: string,
    @Request() req,
    @Body() dto: RespondGroupInvitationDto,
  ) {
    return this.invitationsService.respond(
      invitationId,
      req.user.id,
      dto.accept,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('group-invitations/:id')
  async cancel(@Param('id') invitationId: string, @Request() req) {
    await this.invitationsService.cancel(invitationId, req.user.id);
    return { status: 'cancelled' };
  }
}
