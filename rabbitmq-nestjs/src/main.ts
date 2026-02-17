import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { rmqConfig } from './rabbitmq.config';

async function bootstrap() {
  // Create the HTTP application
  const app = await NestFactory.create(AppModule);

  // Connect the RabbitMQ microservice (consumer)
  app.connectMicroservice<MicroserviceOptions>({
    ...rmqConfig,
    options: {
      ...rmqConfig.options,
      noAck: false, // Enable manual acknowledgment
    },
  } as MicroserviceOptions);

  // Start both HTTP server and microservice
  await app.startAllMicroservices();
  console.log('[RabbitMQ Microservice] Consumer is listening...');

  await app.listen(3000);
  console.log('[HTTP Server] Running on http://localhost:3000');
  console.log('');
  console.log('Test endpoints:');
  console.log('  GET  http://localhost:3000/send     - Send message & get reply');
  console.log('  POST http://localhost:3000/order    - Emit order event');
  console.log('  POST http://localhost:3000/register - Emit user registration event');
}
bootstrap();
