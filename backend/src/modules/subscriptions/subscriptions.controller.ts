import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

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
  @ApiOkResponse({
    description: 'Returns whether Stripe and PostgreSQL billing configuration values are present.',
  })
  getStatus() {
    return this.subscriptionsService.getStatus();
  }

  @Post('checkout-session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe checkout session scaffold for the authenticated user' })
  @ApiBody({ type: CreateCheckoutSessionDto })
  @ApiOkResponse({
    description: 'Returns the scaffold payload that would be used to create a Stripe checkout session.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Stripe secret key or the requested price id is not configured.',
  })
  createCheckoutSession(
    @CurrentUser() user: JwtPayload,
    @Body() payload: CreateCheckoutSessionDto,
  ) {
    return this.subscriptionsService.createCheckoutSession(user.sub, payload);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Receive Stripe webhook events (scaffold)' })
  @ApiHeader({
    name: 'stripe-signature',
    required: false,
    description: 'Stripe webhook signature header used for verification.',
  })
  @ApiOkResponse({
    description: 'Returns scaffold verification status when webhook configuration is present.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Stripe webhook secret or signature header is missing.',
  })
  handleWebhook(@Headers('stripe-signature') stripeSignature?: string) {
    return this.subscriptionsService.handleWebhook(!!stripeSignature);
  }
}
