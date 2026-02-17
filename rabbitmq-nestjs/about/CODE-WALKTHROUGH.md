# Code Walkthrough

## 1. `src/main.ts` — Application Entry Point

```typescript
const app = await NestFactory.create(AppModule);
```
Creates the standard NestJS HTTP application.

```typescript
app.connectMicroservice<MicroserviceOptions>({
  ...rmqConfig,
  options: { ...rmqConfig.options, noAck: false },
});
```
Connects a **RabbitMQ microservice** to the same app. `noAck: false` means we use **manual acknowledgment** — the consumer must explicitly confirm it processed each message. This prevents message loss if the consumer crashes.

```typescript
await app.startAllMicroservices();
await app.listen(3000);
```
Starts both the RabbitMQ consumer (listening for messages) and the HTTP server (listening on port 3000).

---

## 2. `src/rabbitmq.config.ts` — Configuration

```typescript
export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqps://...';
export const RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE || 'nestjs_queue';
```
Centralizes the connection URL and queue name. Uses environment variables with fallback defaults.

```typescript
export const rmqConfig: RmqOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [RABBITMQ_URL],
    queue: RABBITMQ_QUEUE,
    queueOptions: { durable: true },
  },
};
```
- `Transport.RMQ` tells NestJS to use the RabbitMQ transport layer
- `durable: true` means the queue survives broker restarts (messages are written to disk)

---

## 3. `src/app.module.ts` — Root Module

```typescript
ClientsModule.register([{
  name: 'RABBITMQ_SERVICE',
  transport: Transport.RMQ,
  options: { urls: [RABBITMQ_URL], queue: RABBITMQ_QUEUE, ... },
}])
```
Registers a **RabbitMQ client** that can be injected into services. The `name: 'RABBITMQ_SERVICE'` is the injection token used later in `ProducerService`.

```typescript
controllers: [AppController, ConsumerService],
providers: [ProducerService, RabbitmqDirectService],
```
- `AppController` handles HTTP requests
- `ConsumerService` handles incoming RabbitMQ messages
- `ProducerService` sends messages via the NestJS microservice client
- `RabbitmqDirectService` publishes to the no-consumer "visible" queue

---

## 4. `src/producer.service.ts` — Message Producer

```typescript
@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy
```
Injects the RabbitMQ client registered in the module.

```typescript
async sendMessage(pattern: string, data: unknown) {
  return firstValueFrom(this.client.send(pattern, data));
}
```
`client.send()` uses the **request/reply pattern**. It sends a message with a pattern (e.g., `'get_hello'`) and waits for the consumer's response. `firstValueFrom()` converts the Observable to a Promise.

```typescript
emitEvent(pattern: string, data: unknown) {
  this.client.emit(pattern, data);
}
```
`client.emit()` uses the **event pattern** — fire and forget. The producer doesn't wait for a response.

---

## 5. `src/consumer.service.ts` — Message Consumer

```typescript
@MessagePattern('get_hello')
handleGetHello(@Payload() data: unknown, @Ctx() context: RmqContext) {
```
`@MessagePattern('get_hello')` subscribes to messages with pattern `get_hello`. When one arrives, this method is called.

```typescript
const channel = context.getChannelRef();
const originalMsg = context.getMessage();
channel.ack(originalMsg);
```
**Manual acknowledgment** — tells RabbitMQ "I've processed this message, you can remove it from the queue." Without this, RabbitMQ would re-deliver the message if the consumer disconnects.

```typescript
return { message: 'Hello from RabbitMQ consumer!', received: data };
```
The return value is sent **back to the producer** as the reply (request/reply pattern).

```typescript
@EventPattern('order_created')
handleOrderCreated(@Payload() data: unknown, @Ctx() context: RmqContext) {
```
`@EventPattern` listens for events. Unlike `@MessagePattern`, there is **no return value** sent back to the producer.

---

## 6. `src/rabbitmq-direct.service.ts` — Direct AMQP Publisher

```typescript
import { connect, Channel, ChannelModel } from 'amqplib';
```
Uses the raw `amqplib` library directly (not the NestJS microservice abstraction) for fine-grained control.

```typescript
this.connection = await connect(RABBITMQ_URL);
this.channel = await this.connection.createChannel();
await this.channel.assertQueue('visible_messages', { durable: true });
```
Opens a direct AMQP connection, creates a channel, and declares the `visible_messages` queue. `assertQueue` creates the queue if it doesn't exist.

```typescript
this.channel.sendToQueue('visible_messages', Buffer.from(payload), {
  persistent: true,
  contentType: 'application/json',
});
```
Publishes a message directly to the queue. `persistent: true` ensures the message survives a broker restart. **No consumer is attached to this queue**, so messages accumulate and can be viewed in the RabbitMQ Management UI.

---

## 7. `src/app.controller.ts` — HTTP Endpoints

The controller exposes REST endpoints that trigger message operations:

- `GET /` — Health check
- `GET /send` — Sends a message via request/reply pattern
- `POST /order` — Emits an order event (consumed instantly)
- `POST /register` — Emits a registration event (consumed instantly)
- `POST /publish` — Publishes to `visible_messages` queue (stays visible in Manager)
- `POST /publish/order` — Publishes an order to `visible_messages`
- `POST /publish/user` — Publishes a user registration to `visible_messages`
