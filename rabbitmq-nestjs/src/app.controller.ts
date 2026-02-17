import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { RabbitmqDirectService } from './rabbitmq-direct.service';

@Controller()
export class AppController {
  constructor(
    private readonly producerService: ProducerService,
    private readonly rabbitmqDirect: RabbitmqDirectService,
  ) {}

  @Get()
  getHello(): string {
    return 'RabbitMQ NestJS App is running!';
  }

  // Send a message and wait for a response (request/reply pattern)
  @Get('send')
  async sendMessage() {
    const result = await this.producerService.sendMessage('get_hello', {
      text: 'Hello RabbitMQ!',
      timestamp: new Date().toISOString(),
    });
    return result;
  }

  // Emit an event (fire-and-forget pattern)
  @Post('order')
  async createOrder(@Body() body: { item: string; quantity: number }) {
    this.producerService.emitEvent('order_created', {
      orderId: Math.floor(Math.random() * 10000),
      item: body.item || 'Widget',
      quantity: body.quantity || 1,
      timestamp: new Date().toISOString(),
    });
    return { status: 'Order event emitted to RabbitMQ' };
  }

  // Emit a user registration event
  @Post('register')
  async registerUser(@Body() body: { name: string; email: string }) {
    this.producerService.emitEvent('user_registered', {
      userId: Math.floor(Math.random() * 10000),
      name: body.name || 'John Doe',
      email: body.email || 'john@example.com',
      timestamp: new Date().toISOString(),
    });
    return { status: 'User registration event emitted to RabbitMQ' };
  }

  // ============================================================
  // VISIBLE MESSAGES — these stay in the queue for inspection
  // in the RabbitMQ Management UI (no consumer picks them up)
  // ============================================================

  // Publish a custom message that stays visible in RabbitMQ Manager
  @Post('publish')
  async publishMessage(@Body() body: { message: string }) {
    const payload = {
      message: body.message || 'Hello from NestJS!',
      sender: 'nestjs-app',
      timestamp: new Date().toISOString(),
    };
    await this.rabbitmqDirect.publishToVisibleQueue(payload);
    return {
      status: 'Message published to visible_messages queue',
      info: 'Go to RabbitMQ Manager → Queues → visible_messages → Get Messages to see it',
      payload,
    };
  }

  // Publish a sample order to the visible queue
  @Post('publish/order')
  async publishOrder(@Body() body: { item: string; quantity: number }) {
    const payload = {
      type: 'ORDER',
      orderId: Math.floor(Math.random() * 10000),
      item: body.item || 'Widget',
      quantity: body.quantity || 1,
      timestamp: new Date().toISOString(),
    };
    await this.rabbitmqDirect.publishToVisibleQueue(payload);
    return {
      status: 'Order published to visible_messages queue',
      info: 'Go to RabbitMQ Manager → Queues → visible_messages → Get Messages to see it',
      payload,
    };
  }

  // Publish a sample user registration to the visible queue
  @Post('publish/user')
  async publishUser(@Body() body: { name: string; email: string }) {
    const payload = {
      type: 'USER_REGISTRATION',
      userId: Math.floor(Math.random() * 10000),
      name: body.name || 'John Doe',
      email: body.email || 'john@example.com',
      timestamp: new Date().toISOString(),
    };
    await this.rabbitmqDirect.publishToVisibleQueue(payload);
    return {
      status: 'User registration published to visible_messages queue',
      info: 'Go to RabbitMQ Manager → Queues → visible_messages → Get Messages to see it',
      payload,
    };
  }
}
