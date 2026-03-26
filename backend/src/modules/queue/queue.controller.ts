import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { QueueService } from './queue.service';

@ApiTags('Queue')
@Controller('queue')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get queue system status' })
  async getStatus() {
    return this.queueService.getStatus();
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get queue statistics' })
  async getStats() {
    try {
      return await this.queueService.getQueueStats();
    } catch {
      return {
        error: 'Queue statistics unavailable. Redis may not be enabled or connected.',
      };
    }
  }
}
