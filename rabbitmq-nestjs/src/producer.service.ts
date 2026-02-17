import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProducerService implements OnModuleInit {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  async onModuleInit() {
    await this.client.connect();
    console.log('[Producer] Connected to RabbitMQ');
  }

  async sendMessage(pattern: string, data: unknown) {
    console.log(`[Producer] Sending message: pattern="${pattern}"`, data);
    return firstValueFrom(this.client.send(pattern, data));
  }

  emitEvent(pattern: string, data: unknown) {
    console.log(`[Producer] Emitting event: pattern="${pattern}"`, data);
    this.client.emit(pattern, data);
  }
}
