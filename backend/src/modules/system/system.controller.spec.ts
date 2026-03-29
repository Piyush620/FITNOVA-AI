import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';

import { QueueService } from 'src/modules/queue/queue.service';

import { SystemController } from './system.controller';

describe('SystemController', () => {
  let controller: SystemController;
  let queueService: { getStatus: jest.Mock };
  let connection: { readyState: number };

  beforeEach(async () => {
    queueService = {
      getStatus: jest.fn().mockReturnValue({
        enabled: false,
        queueName: 'plan-generation',
        workerRunning: false,
      }),
    };
    connection = { readyState: 1 };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        {
          provide: QueueService,
          useValue: queueService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'app.name') {
                return 'FitNova AI';
              }

              return undefined;
            }),
          },
        },
        {
          provide: getConnectionToken(),
          useValue: connection,
        },
      ],
    }).compile();

    controller = module.get<SystemController>(SystemController);
  });

  it('reports healthy services when MongoDB is connected', () => {
    expect(controller.getHealth()).toEqual(
      expect.objectContaining({
        status: 'ok',
        services: expect.objectContaining({
          api: 'up',
          mongodb: 'connected',
          redisQueue: {
            enabled: false,
            queueName: 'plan-generation',
            workerRunning: false,
          },
        }),
      }),
    );
  });

  it('reports degraded health when MongoDB is not connected', () => {
    connection.readyState = 0;

    expect(controller.getHealth()).toEqual(
      expect.objectContaining({
        status: 'degraded',
        services: expect.objectContaining({
          mongodb: 'disconnected',
        }),
      }),
    );
  });
});
