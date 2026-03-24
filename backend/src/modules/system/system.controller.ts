import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from 'src/common/decorators/public.decorator';
import { QueueService } from 'src/modules/queue/queue.service';

@ApiTags('System')
@Controller()
export class SystemController {
  constructor(
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get API root metadata' })
  getRoot() {
    return {
      name: this.configService.get<string>('app.name'),
      status: 'ok',
      version: '1.0.0',
      docsUrl: '/api/v1/docs',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Get API health summary' })
  getHealth() {
    return {
      status: 'ok',
      services: {
        api: 'up',
        mongodb: 'connected',
        redisQueue: this.queueService.getStatus(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
