import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityService } from './activity.service';
import { ListActivityDto } from './dto/list-activity.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Request() req, @Query() query: ListActivityDto) {
    return this.activityService.listForUser(
      req.user.id,
      query.page,
      query.limit,
    );
  }
}
