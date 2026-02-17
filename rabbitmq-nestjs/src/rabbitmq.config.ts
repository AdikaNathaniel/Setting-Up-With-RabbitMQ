import { RmqOptions, Transport } from '@nestjs/microservices';

export const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  'amqps://walfffgq:XSGcjtjufHJgHvw7uLtiOTLH5gy2nXQu@gerbil.rmq.cloudamqp.com/walfffgq';

export const RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE || 'nestjs_queue';

export const rmqConfig: RmqOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [RABBITMQ_URL],
    queue: RABBITMQ_QUEUE,
    queueOptions: {
      durable: true,
    },
  },
};
