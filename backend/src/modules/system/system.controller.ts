import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';

import { Public } from 'src/common/decorators/public.decorator';
import { QueueService } from 'src/modules/queue/queue.service';

@ApiTags('System')
@Controller()
export class SystemController {
  constructor(
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    @InjectConnection() private readonly mongoConnection: Connection,
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
    const mongoReadyState = this.mongoConnection.readyState;

    return {
      status: mongoReadyState === 1 ? 'ok' : 'degraded',
      services: {
        api: 'up',
        mongodb: this.mapMongoStatus(mongoReadyState),
        redisQueue: this.queueService.getStatus(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  private mapMongoStatus(readyState: number) {
    switch (readyState) {
      case 1:
        return 'connected';
      case 2:
        return 'connecting';
      case 3:
        return 'disconnecting';
      default:
        return 'disconnected';
    }
  }
}
