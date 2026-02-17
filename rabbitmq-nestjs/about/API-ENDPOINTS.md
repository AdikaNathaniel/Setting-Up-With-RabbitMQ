# API Endpoints

Base URL: `http://localhost:3000`

---

## GET `/`

Health check endpoint.

**Response:**
```
RabbitMQ NestJS App is running!
```

---

## GET `/send`

Sends a message to RabbitMQ using the **request/reply pattern** and returns the consumer's response.

**How it works:**
1. Producer sends `{ text: "Hello RabbitMQ!", timestamp: "..." }` with pattern `get_hello`
2. Consumer receives it, acknowledges it, and replies
3. Producer returns the reply to the HTTP client

**Response:**
```json
{
  "message": "Hello from RabbitMQ consumer!",
  "received": {
    "text": "Hello RabbitMQ!",
    "timestamp": "2026-02-16T21:52:43.473Z"
  }
}
```

---

## POST `/order`

Emits an order event (fire-and-forget). The consumer processes it but the message is consumed immediately — it does NOT stay in the queue.

**Request body:**
```json
{
  "item": "Laptop",
  "quantity": 2
}
```

**Response:**
```json
{
  "status": "Order event emitted to RabbitMQ"
}
```

---

## POST `/register`

Emits a user registration event (fire-and-forget).

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "status": "User registration event emitted to RabbitMQ"
}
```

---

## POST `/publish`

Publishes a custom message to the `visible_messages` queue. **This message stays in the queue** and can be viewed in the RabbitMQ Management UI.

**Request body:**
```json
{
  "message": "Any text you want to send"
}
```

**Response:**
```json
{
  "status": "Message published to visible_messages queue",
  "info": "Go to RabbitMQ Manager → Queues → visible_messages → Get Messages to see it",
  "payload": {
    "message": "Any text you want to send",
    "sender": "nestjs-app",
    "timestamp": "2026-02-16T21:57:33.129Z"
  }
}
```

---

## POST `/publish/order`

Publishes an order message to the `visible_messages` queue (stays visible).

**Request body:**
```json
{
  "item": "MacBook Pro",
  "quantity": 3
}
```

**Response:**
```json
{
  "status": "Order published to visible_messages queue",
  "info": "Go to RabbitMQ Manager → Queues → visible_messages → Get Messages to see it",
  "payload": {
    "type": "ORDER",
    "orderId": 9440,
    "item": "MacBook Pro",
    "quantity": 3,
    "timestamp": "2026-02-16T21:57:26.355Z"
  }
}
```

---

## POST `/publish/user`

Publishes a user registration message to the `visible_messages` queue (stays visible).

**Request body:**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com"
}
```

**Response:**
```json
{
  "status": "User registration published to visible_messages queue",
  "info": "Go to RabbitMQ Manager → Queues → visible_messages → Get Messages to see it",
  "payload": {
    "type": "USER_REGISTRATION",
    "userId": 9346,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "timestamp": "2026-02-16T21:57:27.259Z"
  }
}
```

---

## Testing with curl

```bash
# Health check
curl http://localhost:3000/

# Request/reply message
curl http://localhost:3000/send

# Fire-and-forget events (consumed instantly)
curl -X POST http://localhost:3000/order -H "Content-Type: application/json" -d '{"item":"Laptop","quantity":2}'
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{"name":"Jane","email":"jane@test.com"}'

# Publish to visible queue (messages stay for inspection in RabbitMQ Manager)
curl -X POST http://localhost:3000/publish -H "Content-Type: application/json" -d '{"message":"Hello from curl!"}'
curl -X POST http://localhost:3000/publish/order -H "Content-Type: application/json" -d '{"item":"Phone","quantity":5}'
curl -X POST http://localhost:3000/publish/user -H "Content-Type: application/json" -d '{"name":"Bob","email":"bob@test.com"}'
```
