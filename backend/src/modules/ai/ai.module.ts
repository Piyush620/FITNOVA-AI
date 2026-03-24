import { Module } from '@nestjs/common';

import { QueueModule } from '../queue/queue.module';
import { UsersModule } from '../users/users.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [UsersModule, QueueModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
