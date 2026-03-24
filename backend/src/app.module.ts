import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import configuration from './common/config/configuration';
import { validationSchema } from './common/config/validation.schema';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { DietModule } from './modules/diet/diet.module';
import { QueueModule } from './modules/queue/queue.module';
import { SystemModule } from './modules/system/system.module';
import { UsersModule } from './modules/users/users.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.mongodbUri'),
      }),
    }),
    QueueModule,
    SystemModule,
    AuthModule,
    UsersModule,
    WorkoutsModule,
    DietModule,
    AiModule,
  ],
})
export class AppModule {}
