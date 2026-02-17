import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { ProducerService } from './producer.service';
import { ConsumerService } from './consumer.service';
import { RabbitmqDirectService } from './rabbitmq-direct.service';
import { RABBITMQ_URL, RABBITMQ_QUEUE } from './rabbitmq.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [RABBITMQ_URL],
          queue: RABBITMQ_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AppController, ConsumerService],
  providers: [ProducerService, RabbitmqDirectService],
})
export class AppModule {}
