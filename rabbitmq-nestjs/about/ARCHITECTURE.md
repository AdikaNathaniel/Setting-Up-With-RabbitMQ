# Project Architecture

## Directory Structure

```
rabbitmq-nestjs/
├── about/                          # Documentation (you are here)
│   ├── PROJECT-OVERVIEW.md         # What this project is about
│   ├── ARCHITECTURE.md             # Architecture and file explanations
│   ├── CODE-WALKTHROUGH.md         # Line-by-line code explanation
│   ├── API-ENDPOINTS.md            # All HTTP endpoints
│   └── HOW-TO-VIEW-MESSAGES.md     # How to see messages in RabbitMQ Manager
├── src/
│   ├── main.ts                     # App entry point — boots HTTP + microservice
│   ├── app.module.ts               # Root module — registers all providers
│   ├── app.controller.ts           # HTTP endpoints (REST API)
│   ├── rabbitmq.config.ts          # Centralized RabbitMQ configuration
│   ├── producer.service.ts         # Sends messages TO RabbitMQ
│   ├── consumer.service.ts         # Receives messages FROM RabbitMQ
│   └── rabbitmq-direct.service.ts  # Publishes to a no-consumer queue (visible in Manager)
├── .env                            # Environment variables (connection URL)
├── package.json                    # Dependencies and scripts
└── tsconfig.json                   # TypeScript configuration
```

## How It Works — The Flow

```
                         CloudAMQP (RabbitMQ Broker)
                        ┌─────────────────────────────┐
   HTTP Request         │                             │
   (e.g. POST /order)   │   ┌─────────────────────┐   │
         │              │   │   nestjs_queue       │   │
         ▼              │   │   (with consumer)    │   │
  ┌──────────────┐      │   └──────────┬──────────┘   │
  │  AppController│─────►│             │              │
  │  (HTTP layer) │      │             ▼              │
  └──────────────┘      │   ┌─────────────────────┐   │
         │              │   │  ConsumerService     │   │
         │              │   │  (picks up messages) │   │
         │              │   └─────────────────────┘   │
         │              │                             │
         │              │   ┌─────────────────────┐   │
         └─────────────►│   │  visible_messages    │   │
    (POST /publish)     │   │  (NO consumer —      │   │
                        │   │   messages stay here  │   │
                        │   │   for inspection)     │   │
                        │   └─────────────────────┘   │
                        └─────────────────────────────┘
```

## Two Types of Queues

### 1. `nestjs_queue` (consumed immediately)
- Used by the NestJS microservice transport
- Messages are sent here by `ProducerService` and consumed by `ConsumerService`
- Messages are picked up **instantly** — they don't stay in the queue

### 2. `visible_messages` (no consumer)
- Created by `RabbitmqDirectService` using raw amqplib
- **No consumer is attached** — messages pile up and stay visible
- You can inspect these in the RabbitMQ Management UI under Queues → visible_messages → Get Messages

## Design Patterns Used

### Request/Reply Pattern (`@MessagePattern`)
- Producer sends a message and **waits for a response**
- Used in `GET /send` → `ConsumerService.handleGetHello()`
- The consumer processes the message and returns a result

### Event Pattern (`@EventPattern`)
- Producer emits an event and **does not wait** (fire-and-forget)
- Used in `POST /order` and `POST /register`
- The consumer handles the event asynchronously

### Direct Publish (raw amqplib)
- Publishes directly to a queue using the AMQP protocol
- Used in `POST /publish`, `POST /publish/order`, `POST /publish/user`
- No consumer attached — messages remain in queue for visual inspection
