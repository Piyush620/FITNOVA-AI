import { Module } from '@nestjs/common';

import { QueueModule } from '../queue/queue.module';
import { SystemController } from './system.controller';

@Module({
  imports: [QueueModule],
  controllers: [SystemController],
})
export class SystemModule {}
