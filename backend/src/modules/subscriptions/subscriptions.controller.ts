import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';

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
    description: 'Returns whether Stripe billing configuration is present and billing persistence is ready.',
  })
  getStatus() {
    return this.subscriptionsService.getStatus();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user subscription summary' })
  @ApiOkResponse({
    description: 'Returns the current subscription tier, status, and billing period details.',
  })
  getCurrentSubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.getCurrentSubscription(user.sub);
  }

  @Post('checkout-session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe checkout session for the authenticated user' })
  @ApiBody({ type: CreateCheckoutSessionDto })
  @ApiOkResponse({
    description: 'Returns the Stripe checkout session id and redirect URL.',
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

  @Post('checkout-session/confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a Stripe checkout session and sync subscription state' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['sessionId'],
      properties: {
        sessionId: {
          type: 'string',
        },
      },
    },
  })
  confirmCheckoutSession(
    @CurrentUser() user: JwtPayload,
    @Body('sessionId') sessionId: string,
  ) {
    return this.subscriptionsService.confirmCheckoutSession(user.sub, sessionId);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Receive Stripe webhook events' })
  @ApiHeader({
    name: 'stripe-signature',
    required: false,
    description: 'Stripe webhook signature header used for verification.',
  })
  @ApiOkResponse({
    description: 'Returns webhook verification status when Stripe signature validation succeeds.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Stripe webhook secret or signature header is missing.',
  })
  handleWebhook(
    @Req() request: FastifyRequest & { rawBody?: Buffer | string },
    @Headers('stripe-signature') stripeSignature?: string,
  ) {
    return this.subscriptionsService.handleWebhook(request.rawBody, stripeSignature);
  }
}
