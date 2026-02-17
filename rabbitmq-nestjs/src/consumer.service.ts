import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller()
export class ConsumerService {
  @MessagePattern('get_hello')
  handleGetHello(@Payload() data: unknown, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    console.log('[Consumer] Received "get_hello" message:', data);
    channel.ack(originalMsg);
    return { message: 'Hello from RabbitMQ consumer!', received: data };
  }

  @EventPattern('order_created')
  handleOrderCreated(@Payload() data: unknown, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    console.log('[Consumer] Received "order_created" event:', data);
    channel.ack(originalMsg);
  }

  @EventPattern('user_registered')
  handleUserRegistered(@Payload() data: unknown, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    console.log('[Consumer] Received "user_registered" event:', data);
    channel.ack(originalMsg);
  }
}
