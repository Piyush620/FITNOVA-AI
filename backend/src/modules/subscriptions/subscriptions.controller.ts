import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription and billing configuration status' })
  getStatus() {
    return this.subscriptionsService.getStatus();
  }

  @Post('checkout-session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe checkout session scaffold for the authenticated user' })
  createCheckoutSession(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CreateCheckoutSessionDto,
  ) {
    return this.subscriptionsService.createCheckoutSession(user.sub, payload);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Receive Stripe webhook events (scaffold)' })
  handleWebhook(@Headers('stripe-signature') stripeSignature?: string) {
    return this.subscriptionsService.handleWebhook(!!stripeSignature);
  }
}
