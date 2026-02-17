# How to View Messages in RabbitMQ Manager

## Why Messages Disappear

When a **consumer** is attached to a queue, RabbitMQ delivers messages to the consumer immediately. The consumer acknowledges the message, and RabbitMQ removes it from the queue. This is why the `nestjs_queue` appears empty — messages are consumed the instant they arrive.

## The Solution: `visible_messages` Queue

This project creates a second queue called **`visible_messages`** that has **no consumer attached**. Messages published to this queue accumulate and stay there until you manually retrieve or purge them.

## Step-by-Step: Viewing Messages

### 1. Start the Application

```bash
cd rabbitmq-nestjs
npm run start
```

### 2. Send Some Messages

Use the `/publish` endpoints to send messages that will stay in the queue:

```bash
curl -X POST http://localhost:3000/publish -H "Content-Type: application/json" -d '{"message":"Hello RabbitMQ!"}'
curl -X POST http://localhost:3000/publish/order -H "Content-Type: application/json" -d '{"item":"Laptop","quantity":1}'
curl -X POST http://localhost:3000/publish/user -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@test.com"}'
```

### 3. Open the RabbitMQ Management UI

1. Go to your CloudAMQP dashboard
2. Click **"RabbitMQ Manager"** in the left sidebar
3. This opens the RabbitMQ Management web interface

### 4. View the Queues

1. Click the **"Queues"** tab in the top navigation
2. You will see two queues:
   - **`nestjs_queue`** — 0 messages (consumed immediately)
   - **`visible_messages`** — 3 messages (or however many you sent)

### 5. Inspect Individual Messages

1. Click on **`visible_messages`** to open the queue details
2. Scroll down to the **"Get messages"** section
3. Set:
   - **Ack Mode**: `Nack message requeue true` (this peeks without removing)
   - **Encoding**: `auto`
   - **Messages**: `10` (or however many you want to see)
4. Click **"Get Message(s)"**
5. You will see the actual JSON payload of each message:

```json
{
  "message": "Hello RabbitMQ!",
  "sender": "nestjs-app",
  "timestamp": "2026-02-16T21:57:33.129Z"
}
```

### 6. Explore Other Tabs

While the app is running, also check:

- **Connections** tab — Shows the TCP connections from your NestJS app to RabbitMQ
- **Channels** tab — Shows the channels opened within those connections
- **Exchanges** tab — Shows the default AMQP exchanges (amq.direct, amq.fanout, amq.topic, etc.)

## Queue Comparison

| Queue | Has Consumer? | Messages Stay? | Purpose |
|-------|--------------|----------------|---------|
| `nestjs_queue` | Yes | No (consumed instantly) | Normal microservice messaging |
| `visible_messages` | No | Yes (accumulate) | Visual inspection in Management UI |
