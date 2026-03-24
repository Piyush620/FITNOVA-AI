import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return this.usersService.getCurrentUser(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current authenticated user profile' })
  async updateCurrentUser(
    @CurrentUser() user: JwtPayload,
    @Body() payload: UpdateUserProfileDto,
  ) {
    return this.usersService.updateCurrentUser(user.sub, payload);
  }

  @Get('me/dashboard')
  @ApiOperation({ summary: 'Get a dashboard summary for the current user' })
  async getDashboardSnapshot(@CurrentUser() user: JwtPayload) {
    return this.usersService.getDashboardSnapshot(user.sub);
  }
}
