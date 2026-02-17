import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { connect, Channel, ChannelModel } from 'amqplib';
import { RABBITMQ_URL } from './rabbitmq.config';

/**
 * Direct AMQP connection for publishing messages to queues
 * that have NO consumer — so messages stay visible in the
 * RabbitMQ Management UI for inspection.
 */
@Injectable()
export class RabbitmqDirectService implements OnModuleInit, OnModuleDestroy {
  private connection!: ChannelModel;
  private channel!: Channel;
  private readonly logger = new Logger(RabbitmqDirectService.name);

  // Queue with no consumer — messages persist here for viewing in the Manager
  static readonly VISIBLE_QUEUE = 'visible_messages';

  async onModuleInit() {
    this.connection = await connect(RABBITMQ_URL);
    this.channel = await this.connection.createChannel();

    // Declare the queue (durable so it survives broker restarts)
    await this.channel.assertQueue(RabbitmqDirectService.VISIBLE_QUEUE, {
      durable: true,
    });

    this.logger.log(
      `Connected. Queue "${RabbitmqDirectService.VISIBLE_QUEUE}" ready (no consumer — messages stay visible).`,
    );
  }

  async publishToVisibleQueue(message: Record<string, unknown>) {
    const payload = JSON.stringify(message);
    this.channel.sendToQueue(
      RabbitmqDirectService.VISIBLE_QUEUE,
      Buffer.from(payload),
      { persistent: true, contentType: 'application/json' },
    );
    this.logger.log(`Published to "${RabbitmqDirectService.VISIBLE_QUEUE}": ${payload}`);
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
